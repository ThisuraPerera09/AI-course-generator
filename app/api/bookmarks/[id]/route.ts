import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";

// Delete a bookmark
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

    // Verify bookmark belongs to user
    const bookmark = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.id, Number.parseInt(id, 10)),
          eq(bookmarks.userId, user.id)
        )
      )
      .limit(1)
      .then((results) => results[0] || null);

    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    await db.delete(bookmarks).where(eq(bookmarks.id, Number.parseInt(id, 10)));

    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete bookmark",
      },
      { status: 500 }
    );
  }
}
