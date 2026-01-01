"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Quiz from "@/components/Quiz";
import ShareButton from "@/components/ShareButton";
import NotesEditor from "@/components/NotesEditor";
import BookmarkButton from "@/components/BookmarkButton";
import FavoriteButton from "@/components/FavoriteButton";
import ExportButton from "@/components/ExportButton";
import ReadingMode from "@/components/ReadingMode";
import TextToSpeech from "@/components/TextToSpeech";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LessonProgress {
  lessonId: number;
  completedAt: Date | null;
  quizScore: number | null;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  duration?: string;
  quizzes?: QuizQuestion[];
  progress?: LessonProgress | null;
}

interface Course {
  id: number;
  title: string;
  description: string;
  topic: string;
  level: string;
  duration: string;
  isPublic?: boolean;
  shareToken?: string | null;
  thumbnail?: string | null;
  lessons: Lesson[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Map<number, LessonProgress>>(
    new Map()
  );

  useEffect(() => {
    if (params.id) {
      fetchCourse(Number(params.id));
      fetchProgress(Number(params.id));
    }
  }, [params.id]);

  const fetchCourse = async (id: number) => {
    try {
      const response = await fetch(`/api/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (courseId: number) => {
    try {
      const response = await fetch(`/api/progress?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        const progressMap = new Map<number, LessonProgress>();
        if (data.lessons) {
          for (const lesson of data.lessons) {
            if (lesson.progress) {
              progressMap.set(lesson.id, lesson.progress);
            }
          }
        }
        setProgress(progressMap);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const markLessonComplete = async (lessonId: number) => {
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId }),
      });

      if (response.ok) {
        const newProgress = await response.json();
        setProgress((prev) => {
          const updated = new Map(prev);
          updated.set(lessonId, {
            lessonId,
            completedAt: new Date(newProgress.completedAt),
            quizScore: newProgress.quizScore,
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Course not found</div>
        <Link href="/courses" className="text-blue-600 hover:underline">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  const completedLessons = Array.from(progress.values()).filter(
    (p) => p.completedAt !== null
  ).length;
  const totalLessons = course.lessons?.length || 0;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const sortedLessons = [...(course.lessons || [])].sort(
    (a, b) => a.order - b.order
  );
  const lastIncompleteLesson =
    sortedLessons.find((lesson) => !progress.get(lesson.id)?.completedAt) ||
    sortedLessons[0];

  const scrollToLesson = (lessonId: number) => {
    const element = document.getElementById(`lesson-${lessonId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/courses"
        className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Back to Courses
      </Link>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8">
        {course.thumbnail && (
          <div className="mb-6">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {course.title}
              </h1>
              <FavoriteButton courseId={course.id} />
            </div>
            <div className="flex items-center gap-4">
              <ShareButton
                courseId={course.id}
                shareToken={course.shareToken ?? null}
                isPublic={course.isPublic ?? false}
                onToggle={(isPublic, shareToken) => {
                  setCourse({ ...course, isPublic, shareToken });
                }}
              />
              <ExportButton courseId={course.id} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progressPercentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {completedLessons} of {totalLessons} lessons completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {lastIncompleteLesson && (
          <button
            onClick={() => scrollToLesson(lastIncompleteLesson.id)}
            className="mb-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            📍 Resume from: {lastIncompleteLesson.title}
          </button>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded">
            {course.level}
          </span>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded">
            {course.topic}
          </span>
          {course.duration && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded">
              {course.duration}
            </span>
          )}
        </div>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {course.description}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Course Lessons ({course.lessons?.length || 0})
        </h2>
      </div>

      <div className="space-y-6">
        {course.lessons && course.lessons.length > 0 ? (
          (() => {
            const sortedLessons = [...course.lessons].sort(
              (a, b) => a.order - b.order
            );
            return sortedLessons.map((lesson) => {
              const lessonProgress = progress.get(lesson.id);
              const isCompleted = lessonProgress?.completedAt !== null;

              return (
                <div
                  key={lesson.id}
                  id={`lesson-${lesson.id}`}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Lesson {lesson.order}: {lesson.title}
                        </h3>
                        {isCompleted && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                            ✓ Completed
                          </span>
                        )}
                        {lessonProgress &&
                          lessonProgress.quizScore !== null && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              Quiz: {lessonProgress.quizScore}%
                            </span>
                          )}
                        <BookmarkButton lessonId={lesson.id} />
                      </div>
                      {lesson.duration && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.duration}
                        </span>
                      )}
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => markLessonComplete(lesson.id)}
                        className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <ReadingMode
                      content={lesson.content}
                      title={lesson.title}
                    />
                    <TextToSpeech text={lesson.content} title={lesson.title} />
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {lesson.content}
                  </div>

                  {/* Notes Editor */}
                  <NotesEditor lessonId={lesson.id} />

                  {lesson.quizzes && lesson.quizzes.length > 0 && (
                    <Quiz
                      questions={lesson.quizzes}
                      lessonTitle={lesson.title}
                      lessonId={lesson.id}
                    />
                  )}
                </div>
              );
            });
          })()
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No lessons available.
          </p>
        )}
      </div>
    </div>
  );
}
