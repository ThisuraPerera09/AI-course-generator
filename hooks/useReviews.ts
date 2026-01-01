import { useEffect, useState } from "react";
import type { ReviewWithDetails } from "@/types";

type ReviewFilter = "due" | "overdue" | "upcoming" | "all";

/**
 * Custom hook to fetch and manage quiz reviews
 * Supports filtering by due date
 */
export function useReviews(filter: ReviewFilter = "all") {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reviews?filter=${filter}`);

      if (!response.ok) {
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
    fetchReviews();
  }, [filter]);

  return { reviews, loading, error, refetch: fetchReviews };
}
