import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProgress } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";

// Get progress for a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;
    const lessonIdNum = Number.parseInt(lessonId, 10);

    const progress = await db
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

    return NextResponse.json(progress);
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
