import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons, quizzes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, asc } from "drizzle-orm";

// Clone a public course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = Number.parseInt(id, 10);

    // Get the course (can be public or user's own)
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course is public or belongs to user
    if (!course.isPublic && course.userId !== user.id) {
      return NextResponse.json(
        { error: "Course is not public" },
        { status: 403 }
      );
    }

    // Create cloned course
    const [clonedCourse] = await db
      .insert(courses)
      .values({
        userId: user.id,
        title: `${course.title} (Copy)`,
        description: course.description,
        topic: course.topic,
        level: course.level,
        duration: course.duration,
        isPublic: false, // Cloned courses are private by default
        shareToken: null,
        updatedAt: new Date(),
      })
      .returning();

    // Clone lessons
    const originalLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));

    if (originalLessons.length > 0) {
      const clonedLessons = await db
        .insert(lessons)
        .values(
          originalLessons.map((lesson) => ({
            courseId: clonedCourse.id,
            title: lesson.title,
            content: lesson.content,
            order: lesson.order,
            duration: lesson.duration,
          }))
        )
        .returning();

      // Clone quizzes
      for (let i = 0; i < originalLessons.length; i++) {
        const originalLesson = originalLessons[i];
        const clonedLesson = clonedLessons[i];

        const originalQuizzes = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.lessonId, originalLesson.id))
          .orderBy(asc(quizzes.order));

        if (originalQuizzes.length > 0) {
          await db.insert(quizzes).values(
            originalQuizzes.map((quiz) => ({
              lessonId: clonedLesson.id,
              question: quiz.question,
              options: quiz.options,
              correctAnswer: quiz.correctAnswer,
              explanation: quiz.explanation,
              order: quiz.order,
            }))
          );
        }
      }
    }

    // Fetch the complete cloned course with lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, clonedCourse.id))
      .orderBy(asc(lessons.order));

    return NextResponse.json(
      {
        ...clonedCourse,
        lessons: courseLessons,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to clone course",
      },
      { status: 500 }
    );
  }
}

