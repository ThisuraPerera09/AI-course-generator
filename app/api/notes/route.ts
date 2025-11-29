import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";

// Get all notes for a lesson
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const userNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          eq(notes.lessonId, Number.parseInt(lessonId, 10))
        )
      )
      .orderBy(notes.createdAt);

    return NextResponse.json(userNotes);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch notes",
      },
      { status: 500 }
    );
  }
}

// Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, content } = body;

    if (!lessonId || !content) {
      return NextResponse.json(
        { error: "lessonId and content are required" },
        { status: 400 }
      );
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        lessonId: Number.parseInt(lessonId, 10),
        content,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create note",
      },
      { status: 500 }
    );
  }
}

