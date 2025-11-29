import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons, quizzes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// Get course by share token (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.shareToken, token))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course || !course.isPublic) {
      return NextResponse.json(
        { error: "Course not found or not public" },
        { status: 404 }
      );
    }

    // Get lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(asc(lessons.order));

    // Get quizzes for each lesson
    const lessonsWithQuizzes = await Promise.all(
      courseLessons.map(async (lesson) => {
        const lessonQuizzes = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.lessonId, lesson.id))
          .orderBy(asc(quizzes.order));

        return {
          ...lesson,
          quizzes: lessonQuizzes.map((q) => ({
            ...q,
            options: JSON.parse(q.options),
          })),
        };
      })
    );

    return NextResponse.json({
      ...course,
      lessons: lessonsWithQuizzes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch course",
      },
      { status: 500 }
    );
  }
}

