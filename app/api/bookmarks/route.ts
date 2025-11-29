import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { and, eq } from "drizzle-orm";

// Get all bookmarks for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookmarks = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, user.id))
      .orderBy(bookmarks.createdAt);

    return NextResponse.json(userBookmarks);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch bookmarks",
      },
      { status: 500 }
    );
  }
}

// Create a bookmark
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, title, note } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    // Check if bookmark already exists
    const existing = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, user.id),
          eq(bookmarks.lessonId, Number.parseInt(lessonId, 10))
        )
      )
      .limit(1)
      .then((results) => results[0] || null);

    if (existing) {
      return NextResponse.json(existing);
    }

    const [newBookmark] = await db
      .insert(bookmarks)
      .values({
        userId: user.id,
        lessonId: Number.parseInt(lessonId, 10),
        title: title || null,
        note: note || null,
      })
      .returning();

    return NextResponse.json(newBookmark, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create bookmark",
      },
      { status: 500 }
    );
  }
}
