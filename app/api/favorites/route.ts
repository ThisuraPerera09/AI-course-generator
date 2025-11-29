import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { favorites, courses } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, desc, and } from "drizzle-orm";

// Get all favorite courses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFavorites = await db
      .select({
        favorite: favorites,
        course: courses,
      })
      .from(favorites)
      .innerJoin(courses, eq(favorites.courseId, courses.id))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt));

    return NextResponse.json(userFavorites.map((item) => item.course));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch favorites",
      },
      { status: 500 }
    );
  }
}

// Add a course to favorites
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(favorites.courseId, Number.parseInt(courseId, 10))
        )
      )
      .limit(1)
      .then((results) => results[0] || null);

    if (existing) {
      return NextResponse.json({ message: "Already favorited" });
    }

    const [newFavorite] = await db
      .insert(favorites)
      .values({
        userId: user.id,
        courseId: Number.parseInt(courseId, 10),
      })
      .returning();

    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add favorite",
      },
      { status: 500 }
    );
  }
}
