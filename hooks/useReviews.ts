import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { ReviewWithDetails } from "@/types";

type ReviewFilter = "due" | "overdue" | "upcoming" | "all";

/**
 * Custom hook to fetch and manage quiz reviews
 * Supports filtering by due date
 * Only fetches when user is authenticated
 */
export function useReviews(filter: ReviewFilter = "all") {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated" || !session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reviews?filter=${filter}`);

      if (!response.ok) {
        // Don't throw error for 401 (just not logged in)
        if (response.status === 401) {
          setReviews([]);
          return;
        }
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when authenticated
    if (status === "authenticated") {
      fetchReviews();
    }
  }, [filter, status]);

  return { reviews, loading, error, refetch: fetchReviews };
}
