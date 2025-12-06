import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizReviews, quizAttempts, lessons, courses } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, lte, gte, desc } from "drizzle-orm";

/**
 * GET /api/reviews
 * Get all quiz reviews for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // 'due', 'overdue', 'upcoming', 'all'

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reviews;

    if (filter === "due") {
      // Reviews due today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      reviews = await db
        .select({
          review: quizReviews,
          lesson: lessons,
          course: courses,
        })
        .from(quizReviews)
        .innerJoin(lessons, eq(quizReviews.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(
          and(
            eq(quizReviews.userId, user.id),
            gte(quizReviews.nextReviewDate, today),
            lte(quizReviews.nextReviewDate, tomorrow)
          )
        )
        .orderBy(quizReviews.nextReviewDate);
    } else if (filter === "overdue") {
      // Overdue reviews
      reviews = await db
        .select({
          review: quizReviews,
          lesson: lessons,
          course: courses,
        })
        .from(quizReviews)
        .innerJoin(lessons, eq(quizReviews.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(
          and(eq(quizReviews.userId, user.id), lte(quizReviews.nextReviewDate, today))
        )
        .orderBy(quizReviews.nextReviewDate);
    } else if (filter === "upcoming") {
      // Reviews in next 7 days
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      reviews = await db
        .select({
          review: quizReviews,
          lesson: lessons,
          course: courses,
        })
        .from(quizReviews)
        .innerJoin(lessons, eq(quizReviews.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(
          and(
            eq(quizReviews.userId, user.id),
            gte(quizReviews.nextReviewDate, today),
            lte(quizReviews.nextReviewDate, nextWeek)
          )
        )
        .orderBy(quizReviews.nextReviewDate);
    } else {
      // All reviews
      reviews = await db
        .select({
          review: quizReviews,
          lesson: lessons,
          course: courses,
        })
        .from(quizReviews)
        .innerJoin(lessons, eq(quizReviews.lessonId, lessons.id))
        .innerJoin(courses, eq(lessons.courseId, courses.id))
        .where(eq(quizReviews.userId, user.id))
        .orderBy(quizReviews.nextReviewDate);
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

