import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// Get all public courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const level = searchParams.get("level");

    let query = db
      .select()
      .from(courses)
      .where(eq(courses.isPublic, true))
      .orderBy(desc(courses.createdAt));

    const publicCourses = await query;

    // Apply filters
    let filtered = publicCourses;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          course.topic.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
      );
    }
    if (level && level !== "all") {
      filtered = filtered.filter(
        (course) => course.level.toLowerCase() === level.toLowerCase()
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch public courses",
      },
      { status: 500 }
    );
  }
}

