import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons, quizzes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, asc, and } from "drizzle-orm";
import { randomBytes } from "node:crypto";

export async function GET(
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

    const course = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, user.id)))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));

    // Fetch quizzes for each lesson
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
            options: JSON.parse(q.options), // Parse JSON string back to array
          })),
        };
      })
    );

    return NextResponse.json({
      ...course,
      lessons: lessonsWithQuizzes,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Verify the course belongs to the user
    const course = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, user.id)))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const { isPublic } = body;

    // Generate share token if making public and token doesn't exist
    let shareToken = course.shareToken;
    if (isPublic && !shareToken) {
      shareToken = randomBytes(32).toString("hex");
    }

    // Update the course
    const [updatedCourse] = await db
      .update(courses)
      .set({
        isPublic: isPublic ?? course.isPublic,
        shareToken: shareToken ?? course.shareToken,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId))
      .returning();

    return NextResponse.json({
      ...updatedCourse,
      isPublic: updatedCourse.isPublic,
      shareToken: updatedCourse.shareToken,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify the course belongs to the user before deleting
    const course = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, user.id)))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
