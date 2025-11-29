import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons, quizzes } from "@/lib/db/schema";
import { generateCourse } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, user.id))
      .orderBy(desc(courses.createdAt));
    return NextResponse.json(userCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, level, duration } = body;

    if (!topic || !level) {
      return NextResponse.json(
        { error: "Topic and level are required" },
        { status: 400 }
      );
    }

    const generatedCourse = await generateCourse({ topic, level, duration });

    const [newCourse] = await db
      .insert(courses)
      .values({
        userId: user.id,
        title: generatedCourse.title,
        description: generatedCourse.description,
        topic,
        level,
        duration: duration || "N/A",
        updatedAt: new Date(),
      })
      .returning();

    // Save lessons to database
    if (generatedCourse.lessons && generatedCourse.lessons.length > 0) {
      const lessonsToInsert = generatedCourse.lessons.map((lesson) => ({
        courseId: newCourse.id,
        title: lesson.title,
        content: lesson.content,
        order: lesson.order,
        duration: lesson.duration || "N/A",
      }));

      const insertedLessons = await db
        .insert(lessons)
        .values(lessonsToInsert)
        .returning();

      // Save quizzes for each lesson
      for (let i = 0; i < insertedLessons.length; i++) {
        const lesson = generatedCourse.lessons[i];
        const insertedLesson = insertedLessons[i];

        if (lesson.quiz && lesson.quiz.length > 0) {
          const quizzesToInsert = lesson.quiz.map((quiz, quizIndex) => ({
            lessonId: insertedLesson.id,
            question: quiz.question,
            options: JSON.stringify(quiz.options), // Store as JSON string
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation || "",
            order: quizIndex,
          }));

          await db.insert(quizzes).values(quizzesToInsert);
        }
      }
    }

    // Fetch the complete course with lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, newCourse.id))
      .orderBy(asc(lessons.order));

    return NextResponse.json(
      {
        ...newCourse,
        lessons: courseLessons,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create course",
      },
      { status: 500 }
    );
  }
}
