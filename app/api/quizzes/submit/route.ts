import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzes, quizAttempts, userProgress, quizReviews } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, inArray, and, desc } from "drizzle-orm";
import {
  calculateNextReview,
  calculateRetentionRate,
  calculateAverageScore,
} from "@/lib/srs-algorithm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, lessonId } = body; // { quizId: selectedAnswerIndex }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers object is required" },
        { status: 400 }
      );
    }

    const quizIds = Object.keys(answers).map(Number);

    if (quizIds.length === 0) {
      return NextResponse.json(
        { error: "No answers provided" },
        { status: 400 }
      );
    }

    // Fetch all quizzes with their correct answers
    const quizData = await db
      .select()
      .from(quizzes)
      .where(inArray(quizzes.id, quizIds));

    // Calculate results
    const results = quizData.map((quiz) => {
      const userAnswer = answers[quiz.id.toString()];
      const isCorrect = userAnswer === quiz.correctAnswer;

      return {
        quizId: quiz.id,
        question: quiz.question,
        userAnswer: userAnswer,
        correctAnswer: quiz.correctAnswer,
        isCorrect: isCorrect,
        explanation: quiz.explanation,
        options: JSON.parse(quiz.options),
      };
    });

    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;
    const score = Math.round((correctCount / totalCount) * 100);

    // Save quiz attempts to database
    const savedAttempts = await Promise.all(
      results.map((result) =>
        db
          .insert(quizAttempts)
          .values({
            userId: user.id,
            quizId: result.quizId,
            score: result.isCorrect ? 100 : 0, // Individual quiz score
            correctCount: result.isCorrect ? 1 : 0,
            totalCount: 1,
            answers: JSON.stringify({ [result.quizId]: result.userAnswer }),
            attemptedAt: new Date(),
          })
          .returning()
      )
    );

    // Use the first attempt ID for the review (or could save overall attempt separately)
    const attemptId = savedAttempts[0]?.[0]?.id;

    // If lessonId is provided, update or create progress with overall quiz score
    if (lessonId) {
      const lessonIdNum = Number.parseInt(lessonId, 10);
      const existing = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, user.id),
            eq(userProgress.lessonId, lessonIdNum)
          )
        )
        .limit(1)
        .then((results) => results[0] || null);

      if (existing) {
        // Update if new score is better
        if (score > (existing.quizScore || 0)) {
          await db
            .update(userProgress)
            .set({ quizScore: score, updatedAt: new Date() })
            .where(eq(userProgress.id, existing.id));
        }
      } else {
        // Create new progress entry
        await db.insert(userProgress).values({
          userId: user.id,
          lessonId: lessonIdNum,
          quizScore: score,
          completedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // ===== SRS INTEGRATION =====
      // Update or create quiz review for spaced repetition
      if (attemptId) {
        const existingReview = await db
          .select()
          .from(quizReviews)
          .where(
            and(
              eq(quizReviews.userId, user.id),
              eq(quizReviews.lessonId, lessonIdNum)
            )
          )
          .limit(1)
          .then((results) => results[0] || null);

        // Get previous attempts to calculate averages
        const previousAttempts = await db
          .select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, user.id))
          .orderBy(desc(quizAttempts.attemptedAt))
          .limit(10);

        const scores = previousAttempts.map((a) => a.score);
        const averageScore = calculateAverageScore(scores);
        const retentionRate = calculateRetentionRate(scores);

        if (existingReview) {
          // Update existing review
          const schedule = calculateNextReview({
            score,
            currentInterval: existingReview.currentInterval,
            reviewCount: existingReview.reviewCount,
            easeFactor: existingReview.easeFactor,
          });

          await db
            .update(quizReviews)
            .set({
              lastAttemptId: attemptId,
              nextReviewDate: schedule.nextReviewDate,
              reviewCount: existingReview.reviewCount + 1,
              currentInterval: schedule.interval,
              lastScore: score,
              averageScore,
              retentionRate,
              status: schedule.status,
              easeFactor: schedule.easeFactor,
              updatedAt: new Date(),
            })
            .where(eq(quizReviews.id, existingReview.id));
        } else {
          // Create new review
          const schedule = calculateNextReview({
            score,
            currentInterval: 1,
            reviewCount: 0,
            easeFactor: 250,
          });

          await db.insert(quizReviews).values({
            userId: user.id,
            lessonId: lessonIdNum,
            lastAttemptId: attemptId,
            nextReviewDate: schedule.nextReviewDate,
            reviewCount: 1,
            currentInterval: schedule.interval,
            lastScore: score,
            averageScore: score,
            retentionRate: 100,
            status: schedule.status,
            easeFactor: schedule.easeFactor,
          });
        }
      }
      // ===== END SRS INTEGRATION =====
    }

    return NextResponse.json({
      results,
      score,
      correctCount,
      totalCount,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
