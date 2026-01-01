import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { ReviewStats } from "@/types";

/**
 * Custom hook to fetch and manage review statistics
 * Automatically refreshes every 5 minutes
 * Only fetches when user is authenticated
 */
export function useReviewStats(autoRefresh = true) {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated" || !session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reviews/stats");

      if (!response.ok) {
        // Don't throw error for 401 (just not logged in)
        if (response.status === 401) {
          setStats(null);
          return;
        }
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
    // Only fetch when authenticated
    if (status === "authenticated") {
      fetchStats();

      if (autoRefresh) {
        const interval = setInterval(fetchStats, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
      }
    }
  }, [autoRefresh, status]);

  return { stats, loading, error, refetch: fetchStats };
}
