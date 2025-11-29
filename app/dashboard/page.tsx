"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Analytics {
  totalCourses: number;
  completedCourses: number;
  averageQuizScore: number;
  learningStreak: number;
  totalTimeSpent: number;
  recentActivity: number;
  stats: {
    totalQuizzes: number;
    totalLessonsCompleted: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (session) {
      fetchAnalytics();
    }
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Failed to load analytics</div>
      </div>
    );
  }

  const completionRate =
    analytics.totalCourses > 0
      ? Math.round((analytics.completedCourses / analytics.totalCourses) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Learning Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Courses
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.totalCourses}
          </p>
        </div>

        {/* Completed Courses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Completed Courses
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {analytics.completedCourses}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {completionRate}% completion rate
          </p>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Average Quiz Score
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.averageQuizScore}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {analytics.stats.totalQuizzes} quizzes taken
          </p>
        </div>

        {/* Learning Streak */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Learning Streak
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {analytics.learningStreak}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            days in a row
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Spent */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Time Spent Learning
          </h3>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.totalTimeSpent}h
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Total time invested in learning
          </p>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {analytics.recentActivity}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Lessons completed in last 7 days
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Lessons Completed
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.stats.totalLessonsCompleted}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Quizzes Taken
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.stats.totalQuizzes}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/courses"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          View My Courses
        </Link>
        <Link
          href="/favorites"
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          View Favorites
        </Link>
      </div>
    </div>
  );
}
