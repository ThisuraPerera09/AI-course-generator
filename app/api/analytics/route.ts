import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  courses,
  userProgress,
  quizAttempts,
  learningSessions,
  lessons,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

// Get learning analytics for the user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Total courses
    const totalCourses = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.userId, user.id))
      .then((results) => results[0]?.count || 0);

    // Completed courses (all lessons completed)
    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, user.id));

    const courseIds = userCourses.map((c) => c.id);
    let completedCourses = 0;

    if (courseIds.length > 0) {
      // Get all lessons for user's courses
      const allLessons = await db
        .select()
        .from(lessons)
        .where(inArray(lessons.courseId, courseIds));

      // Get progress for all lessons
      const lessonIds = allLessons.map((l) => l.id);
      const allProgress = lessonIds.length > 0
        ? await db
            .select()
            .from(userProgress)
            .where(
              and(
                eq(userProgress.userId, user.id),
                inArray(userProgress.lessonId, lessonIds)
              )
            )
        : [];

      // Count courses where all lessons are completed
      const lessonsByCourse = new Map<number, number[]>();
      allLessons.forEach((lesson) => {
        if (!lessonsByCourse.has(lesson.courseId)) {
          lessonsByCourse.set(lesson.courseId, []);
        }
        lessonsByCourse.get(lesson.courseId)!.push(lesson.id);
      });

      const progressByLesson = new Set(
        allProgress.map((p) => p.lessonId)
      );

      for (const [courseId, lessonIds] of lessonsByCourse.entries()) {
        if (lessonIds.every((id) => progressByLesson.has(id))) {
          completedCourses++;
        }
      }
    }

    // Average quiz score
    const quizScores = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id));

    const averageScore =
      quizScores.length > 0
        ? Math.round(
            quizScores.reduce((sum, attempt) => sum + attempt.score, 0) /
              quizScores.length
          )
        : 0;

    // Learning streak (days with at least one completed lesson)
    const completedLessons = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, user.id))
      .orderBy(desc(userProgress.completedAt));

    // Calculate streak
    let streak = 0;
    if (completedLessons.length > 0) {
      const dates = new Set(
        completedLessons.map((p) => {
          const date = new Date(p.completedAt);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        })
      );

      const sortedDates = Array.from(dates).sort().reverse();
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

      let currentDate = new Date(today);
      for (let i = 0; i < sortedDates.length; i++) {
        const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
        if (sortedDates.includes(dateStr)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Total time spent (from learning sessions)
    const sessions = await db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.userId, user.id));

    const totalTimeSeconds = sessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalTimeHours = Math.round((totalTimeSeconds / 3600) * 10) / 10;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();
    const recentProgress = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, user.id),
          sql`${userProgress.completedAt} >= ${sevenDaysAgoTimestamp}`
        )
      );

    return NextResponse.json({
      totalCourses: Number(totalCourses),
      completedCourses,
      averageQuizScore: averageScore,
      learningStreak: streak,
      totalTimeSpent: totalTimeHours,
      recentActivity: recentProgress.length,
      stats: {
        totalQuizzes: quizScores.length,
        totalLessonsCompleted: completedLessons.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}

