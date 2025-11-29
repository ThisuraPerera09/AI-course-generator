import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";

// Update a note
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
    const body = await request.json();

    // Verify note belongs to user
    const note = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, Number.parseInt(id, 10)), eq(notes.userId, user.id)))
      .limit(1)
      .then((results) => results[0] || null);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(notes)
      .set({
        content: body.content,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, Number.parseInt(id, 10)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update note",
      },
      { status: 500 }
    );
  }
}

// Delete a note
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

    // Verify note belongs to user
    const note = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, Number.parseInt(id, 10)), eq(notes.userId, user.id)))
      .limit(1)
      .then((results) => results[0] || null);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await db.delete(notes).where(eq(notes.id, Number.parseInt(id, 10)));

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete note",
      },
      { status: 500 }
    );
  }
}

