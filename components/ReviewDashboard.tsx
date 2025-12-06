"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Review {
  review: {
    id: number;
    nextReviewDate: Date;
    reviewCount: number;
    lastScore: number;
    averageScore: number;
    status: string;
    retentionRate: number;
  };
  lesson: {
    id: number;
    title: string;
    order: number;
  };
  course: {
    id: number;
    title: string;
    topic: string;
  };
}

interface Stats {
  total: number;
  statusCounts: {
    new: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
  dueToday: number;
  overdue: number;
  upcoming: number;
  avgRetention: number;
  avgScore: number;
  streak: {
    current: number;
    longest: number;
  };
}

export default function ReviewDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<"due" | "overdue" | "upcoming" | "all">(
    "due"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?filter=${filter}`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/reviews/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mastered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "reviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "learning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "mastered":
        return "🎉";
      case "reviewing":
        return "📚";
      case "learning":
        return "🌱";
      default:
        return "✨";
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewDate = new Date(d);
    reviewDate.setHours(0, 0, 0, 0);

    const diffTime = reviewDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays < 7) return `In ${diffDays} days`;

    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📚 Review Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Master your knowledge with spaced repetition
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due Today
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.dueToday}
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdue}
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Study Streak
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.streak.current}
                </p>
              </div>
              <div className="text-4xl">🔥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mastered
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.statusCounts.mastered}
                </p>
              </div>
              <div className="text-4xl">🎉</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Retention Rate</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold">{stats.avgRetention}%</p>
                <p className="text-sm opacity-75 mb-1">average</p>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${stats.avgRetention}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm opacity-90 mb-1">Average Score</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold">{stats.avgScore}%</p>
                <p className="text-sm opacity-75 mb-1">on reviews</p>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${stats.avgScore}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm opacity-90 mb-1">Longest Streak</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold">{stats.streak.longest}</p>
                <p className="text-sm opacity-75 mb-1">days</p>
              </div>
              <p className="text-sm opacity-75 mt-2">
                Keep it up! 💪 Current: {stats.streak.current} days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter("due")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "due"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          📝 Due Today ({stats?.dueToday || 0})
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "overdue"
              ? "bg-red-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          ⚠️ Overdue ({stats?.overdue || 0})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "upcoming"
              ? "bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          📅 Upcoming ({stats?.upcoming || 0})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          📚 All Reviews ({stats?.total || 0})
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading reviews...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-6xl mb-4">
            {filter === "due"
              ? "✅"
              : filter === "overdue"
                ? "🎉"
                : filter === "upcoming"
                  ? "📅"
                  : "🌟"}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {filter === "due"
              ? "No reviews due today!"
              : filter === "overdue"
                ? "All caught up!"
                : filter === "upcoming"
                  ? "No upcoming reviews"
                  : "No reviews yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === "all"
              ? "Complete some quizzes to start building your review schedule"
              : "Keep learning to stay on track!"}
          </p>
          <Link
            href="/courses"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((item) => (
            <div
              key={item.review.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getStatusEmoji(item.review.status)}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.lesson.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.course.title} • Lesson {item.lesson.order}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.review.status)}`}
                    >
                      {item.review.status.charAt(0).toUpperCase() +
                        item.review.status.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {item.review.reviewCount} review
                      {item.review.reviewCount !== 1 ? "s" : ""}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Avg: {item.review.averageScore}%
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Retention: {item.review.retentionRate}%
                    </span>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {formatDate(item.review.nextReviewDate)}
                  </p>
                  <Link
                    href={`/courses/${item.course.id}?lesson=${item.lesson.id}&review=true`}
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Review Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

