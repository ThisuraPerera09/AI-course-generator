import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProgress, lessons } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, inArray } from "drizzle-orm";

// Get progress for a specific course
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Get all lessons for the course
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, Number.parseInt(courseId, 10)))
      .orderBy(lessons.order);

    if (courseLessons.length === 0) {
      return NextResponse.json({ lessons: [], progress: [] });
    }

    // Get progress for all lessons in the course
    const lessonIds = courseLessons.map((l) => l.id);
    const allProgress = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, user.id),
          inArray(userProgress.lessonId, lessonIds)
        )
      );

    const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]));

    return NextResponse.json({
      lessons: courseLessons.map((lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) || null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch progress",
      },
      { status: 500 }
    );
  }
}

// Mark a lesson as complete
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, quizScore } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    // Check if progress already exists
    const existing = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, user.id),
          eq(userProgress.lessonId, lessonId)
        )
      )
      .limit(1)
      .then((results) => results[0] || null);

    if (existing) {
      // Update existing progress
      const [updated] = await db
        .update(userProgress)
        .set({
          completedAt: new Date(),
          quizScore: quizScore !== undefined ? quizScore : existing.quizScore,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(userProgress)
        .values({
          userId: user.id,
          lessonId,
          quizScore: quizScore || null,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json(newProgress, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save progress",
      },
      { status: 500 }
    );
  }
}
