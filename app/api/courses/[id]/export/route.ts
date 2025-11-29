import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons, quizzes } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, asc, and } from "drizzle-orm";

// Export course as PDF or Markdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const courseId = Number.parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "markdown";

    // Get course
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
      .then((results) => results[0] || null);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check access (user's own course or public)
    if (course.userId !== user?.id && !course.isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));

    // Get quizzes for each lesson
    const lessonsWithQuizzes = await Promise.all(
      courseLessons.map(async (lesson) => {
        const lessonQuizzes = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.lessonId, lesson.id))
          .orderBy(asc(quizzes.order));

        return {
          ...lesson,
          quizzes: lessonQuizzes.map((q) => ({
            ...q,
            options: JSON.parse(q.options),
          })),
        };
      })
    );

    if (format === "markdown") {
      // Generate Markdown
      let markdown = `# ${course.title}\n\n`;
      markdown += `**Level:** ${course.level}\n`;
      markdown += `**Topic:** ${course.topic}\n`;
      if (course.duration) {
        markdown += `**Duration:** ${course.duration}\n`;
      }
      markdown += `\n${course.description || ""}\n\n`;
      markdown += `---\n\n`;

      lessonsWithQuizzes.forEach((lesson, index) => {
        markdown += `## Lesson ${lesson.order}: ${lesson.title}\n\n`;
        if (lesson.duration) {
          markdown += `*Duration: ${lesson.duration}*\n\n`;
        }
        markdown += `${lesson.content}\n\n`;

        if (lesson.quizzes && lesson.quizzes.length > 0) {
          markdown += `### Quiz Questions\n\n`;
          lesson.quizzes.forEach((quiz, qIndex) => {
            markdown += `${qIndex + 1}. ${quiz.question}\n`;
            quiz.options.forEach((option, oIndex) => {
              const letter = String.fromCharCode(65 + oIndex);
              const isCorrect = oIndex === quiz.correctAnswer;
              markdown += `   ${letter}. ${option}${isCorrect ? " ✓" : ""}\n`;
            });
            if (quiz.explanation) {
              markdown += `   *Explanation: ${quiz.explanation}*\n`;
            }
            markdown += `\n`;
          });
        }
        markdown += `---\n\n`;
      });

      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${course.title.replace(
            /[^a-z0-9]/gi,
            "_"
          )}.md"`,
        },
      });
    }

    // For PDF, return JSON (client-side will generate PDF)
    return NextResponse.json({
      course,
      lessons: lessonsWithQuizzes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export course",
      },
      { status: 500 }
    );
  }
}
