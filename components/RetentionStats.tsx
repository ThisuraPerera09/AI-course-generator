"use client";

import { useEffect, useState } from "react";

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

export default function RetentionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/reviews/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow p-6 border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Start Your Learning Journey!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete some quizzes to see your retention stats and build your review schedule.
          </p>
        </div>
      </div>
    );
  }

  const statusData = [
    {
      label: "Mastered",
      count: stats.statusCounts.mastered,
      color: "bg-green-500",
      emoji: "🎉",
    },
    {
      label: "Reviewing",
      count: stats.statusCounts.reviewing,
      color: "bg-blue-500",
      emoji: "📚",
    },
    {
      label: "Learning",
      count: stats.statusCounts.learning,
      color: "bg-yellow-500",
      emoji: "🌱",
    },
    {
      label: "New",
      count: stats.statusCounts.new,
      color: "bg-gray-400",
      emoji: "✨",
    },
  ];

  const total = stats.total;
  const percentages = statusData.map((s) =>
    total > 0 ? Math.round((s.count / total) * 100) : 0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span>🧠</span>
        <span>Retention Statistics</span>
      </h3>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Retention Rate
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.avgRetention}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Average Score
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {stats.avgScore}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Learning Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {total} total lessons
          </span>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          {statusData.map((status, index) => {
            const percentage = percentages[index];
            if (percentage === 0) return null;
            return (
              <div
                key={status.label}
                className={`${status.color} h-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
                title={`${status.label}: ${status.count} (${percentage}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="space-y-3">
        {statusData.map((status, index) => (
          <div
            key={status.label}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{status.emoji}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {status.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {percentages[index]}% of total
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {status.count}
            </div>
          </div>
        ))}
      </div>

      {/* Streak Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Study Streak
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.streak.current} days
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Best Streak
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.streak.longest} days
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(stats.dueToday > 0 || stats.overdue > 0) && (
        <div className="mt-6">
          <a
            href="/reviews"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
          >
            {stats.overdue > 0
              ? `Review ${stats.overdue} Overdue Lesson${stats.overdue !== 1 ? "s" : ""}`
              : `Review ${stats.dueToday} Lesson${stats.dueToday !== 1 ? "s" : ""} Today`}
          </a>
        </div>
      )}
    </div>
  );
}

