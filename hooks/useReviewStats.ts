import { useEffect, useState } from "react";
import type { ReviewStats } from "@/types";

/**
 * Custom hook to fetch and manage review statistics
 * Automatically refreshes every 5 minutes
 */
export function useReviewStats(autoRefresh = true) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reviews/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch review stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching review stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return { stats, loading, error, refetch: fetchStats };
}
