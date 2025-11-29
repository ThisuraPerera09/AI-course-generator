"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Quiz from "@/components/Quiz";
import FavoriteButton from "@/components/FavoriteButton";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  duration?: string;
  quizzes?: QuizQuestion[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  topic: string;
  level: string;
  duration: string;
  lessons: Lesson[];
}

export default function SharedCoursePage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.token) {
      fetchCourse(params.token as string);
    }
  }, [params.token]);

  const fetchCourse = async (token: string) => {
    try {
      const response = await fetch(`/api/courses/share/${token}`);
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
        <div className="text-center">Course not found or not public</div>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/public"
        className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Back to Public Gallery
      </Link>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {course.title}
          </h1>
          <FavoriteButton courseId={course.id} />
        </div>
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
          course.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Lesson {lesson.order}: {lesson.title}
                </h3>
                {lesson.duration && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 mb-3 block">
                    {lesson.duration}
                  </span>
                )}
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {lesson.content}
                </div>

                {lesson.quizzes && lesson.quizzes.length > 0 && (
                  <Quiz
                    questions={lesson.quizzes}
                    lessonTitle={lesson.title}
                    lessonId={lesson.id}
                  />
                )}
              </div>
            ))
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No lessons available.
          </p>
        )}
      </div>
    </div>
  );
}

