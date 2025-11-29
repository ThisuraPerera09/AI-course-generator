import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzes, quizAttempts, userProgress } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, inArray, and } from "drizzle-orm";

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
    const attemptPromises = results.map((result) =>
      db.insert(quizAttempts).values({
        userId: user.id,
        quizId: result.quizId,
        score: result.isCorrect ? 100 : 0, // Individual quiz score
        correctCount: result.isCorrect ? 1 : 0,
        totalCount: 1,
        answers: JSON.stringify({ [result.quizId]: result.userAnswer }),
        attemptedAt: new Date(),
      })
    );

    await Promise.all(attemptPromises);

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
