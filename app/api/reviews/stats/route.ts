import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizReviews, quizAttempts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/reviews/stats
 * Get review statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all reviews
    const allReviews = await db
      .select()
      .from(quizReviews)
      .where(eq(quizReviews.userId, user.id));

    // Count by status
    const statusCounts = {
      new: allReviews.filter((r) => r.status === "new").length,
      learning: allReviews.filter((r) => r.status === "learning").length,
      reviewing: allReviews.filter((r) => r.status === "reviewing").length,
      mastered: allReviews.filter((r) => r.status === "mastered").length,
    };

    // Count due/overdue
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = allReviews.filter((r) => {
      const reviewDate = new Date(r.nextReviewDate);
      return reviewDate >= today && reviewDate < tomorrow;
    }).length;

    const overdue = allReviews.filter((r) => {
      const reviewDate = new Date(r.nextReviewDate);
      return reviewDate < today;
    }).length;

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = allReviews.filter((r) => {
      const reviewDate = new Date(r.nextReviewDate);
      return reviewDate >= tomorrow && reviewDate <= nextWeek;
    }).length;

    // Calculate average retention rate
    const avgRetention =
      allReviews.length > 0
        ? Math.round(
            allReviews.reduce((sum, r) => sum + r.retentionRate, 0) /
              allReviews.length
          )
        : 100;

    // Calculate average score
    const avgScore =
      allReviews.length > 0
        ? Math.round(
            allReviews.reduce((sum, r) => sum + r.averageScore, 0) /
              allReviews.length
          )
        : 0;

    // Get recent quiz attempts for streak calculation
    const recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id))
      .orderBy(desc(quizAttempts.attemptedAt))
      .limit(100);

    // Calculate study streak
    const reviewDates = recentAttempts.map((a) => a.attemptedAt);
    const streak = calculateStudyStreak(reviewDates);

    return NextResponse.json({
      total: allReviews.length,
      statusCounts,
      dueToday,
      overdue,
      upcoming,
      avgRetention,
      avgScore,
      streak,
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch review stats" },
      { status: 500 }
    );
  }
}

/**
 * Calculate study streak from review dates
 */
function calculateStudyStreak(
  reviewDates: Date[]
): { current: number; longest: number } {
  if (reviewDates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = reviewDates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastReview = new Date(sortedDates[0]);
  lastReview.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) {
    currentStreak = 0;
  } else {
    currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      current.setHours(0, 0, 0, 0);

      const previous = new Date(sortedDates[i - 1]);
      previous.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        currentStreak++;
        tempStreak++;
      } else if (diff === 0) {
        continue;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

