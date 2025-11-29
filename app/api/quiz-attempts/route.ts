import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizAttempts, quizzes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, desc, and, inArray } from "drizzle-orm";

// Get quiz attempts history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    const lessonId = searchParams.get("lessonId");

    // If lessonId is provided, get all quizzes for that lesson and their attempts
    if (lessonId) {
      const lessonQuizzes = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.lessonId, Number.parseInt(lessonId, 10)));

      if (lessonQuizzes.length === 0) {
        return NextResponse.json({ attempts: [], bestScores: {} });
      }

      const quizIds = lessonQuizzes.map((q) => q.id);
      const lessonAttempts = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, user.id),
            inArray(quizAttempts.quizId, quizIds)
          )
        )
        .orderBy(desc(quizAttempts.attemptedAt));

      // Get best score per quiz
      const bestScores = new Map<number, number>();
      for (const attempt of lessonAttempts) {
        const current = bestScores.get(attempt.quizId);
        if (!current || attempt.score > current) {
          bestScores.set(attempt.quizId, attempt.score);
        }
      }

      return NextResponse.json({
        attempts: lessonAttempts,
        bestScores: Object.fromEntries(bestScores),
      });
    }

    // If quizId is provided, get attempts for that specific quiz
    if (quizId) {
      const attempts = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, user.id),
            eq(quizAttempts.quizId, Number.parseInt(quizId, 10))
          )
        )
        .orderBy(desc(quizAttempts.attemptedAt));

      return NextResponse.json({ attempts });
    }

    // Get all attempts for the user
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id))
      .orderBy(desc(quizAttempts.attemptedAt));

    return NextResponse.json({ attempts });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch quiz attempts",
      },
      { status: 500 }
    );
  }
}

// Save a quiz attempt
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, score, correctCount, totalCount, answers } = body;

    if (!quizId || score === undefined || !answers) {
      return NextResponse.json(
        { error: "quizId, score, and answers are required" },
        { status: 400 }
      );
    }

    const [newAttempt] = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        quizId: Number.parseInt(quizId, 10),
        score,
        correctCount: correctCount || 0,
        totalCount: totalCount || 0,
        answers: JSON.stringify(answers),
        attemptedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newAttempt, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save quiz attempt",
      },
      { status: 500 }
    );
  }
}
