import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizReviews, quizAttempts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, desc } from "drizzle-orm";
import {
  calculateNextReview,
  calculateRetentionRate,
  calculateAverageScore,
} from "@/lib/srs-algorithm";

/**
 * POST /api/reviews/update
 * Update or create quiz review after completing a quiz
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, quizAttemptId, score } = body;

    if (!lessonId || !quizAttemptId || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create existing review
    const existingReview = await db
      .select()
      .from(quizReviews)
      .where(
        and(eq(quizReviews.userId, user.id), eq(quizReviews.lessonId, lessonId))
      )
      .limit(1)
      .then((results) => results[0] || null);

    // Get previous quiz attempts for this lesson to calculate averages
    // Note: This is a simplified version - in production, you'd need proper joins
    const previousAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id))
      .orderBy(desc(quizAttempts.attemptedAt))
      .limit(10);

    const scores = previousAttempts.map((a) => a.score);
    scores.push(score);

    const averageScore = calculateAverageScore(scores);
    const retentionRate = calculateRetentionRate(scores);

    if (existingReview) {
      // Calculate next review schedule
      const schedule = calculateNextReview({
        score,
        currentInterval: existingReview.currentInterval,
        reviewCount: existingReview.reviewCount,
        easeFactor: existingReview.easeFactor,
      });

      // Update existing review
      await db
        .update(quizReviews)
        .set({
          lastAttemptId: quizAttemptId,
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

      return NextResponse.json({
        success: true,
        review: {
          ...existingReview,
          nextReviewDate: schedule.nextReviewDate,
          status: schedule.status,
        },
        message: `Great! Review scheduled for ${schedule.nextReviewDate.toLocaleDateString()}`,
      });
    } else {
      // Create new review
      const schedule = calculateNextReview({
        score,
        currentInterval: 1,
        reviewCount: 0,
        easeFactor: 250, // Default ease factor
      });

      const [newReview] = await db
        .insert(quizReviews)
        .values({
          userId: user.id,
          lessonId,
          lastAttemptId: quizAttemptId,
          nextReviewDate: schedule.nextReviewDate,
          reviewCount: 1,
          currentInterval: schedule.interval,
          lastScore: score,
          averageScore: score,
          retentionRate: 100,
          status: schedule.status,
          easeFactor: schedule.easeFactor,
        })
        .returning();

      return NextResponse.json({
        success: true,
        review: newReview,
        message: `Review created! Next review: ${schedule.nextReviewDate.toLocaleDateString()}`,
      });
    }
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

