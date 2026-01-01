import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Course } from "@/types";

/**
 * Custom hook to fetch user's courses
 * Only fetches when user is authenticated
 */
export function useCourses() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    // Don't fetch if not authenticated
    if (status !== "authenticated" || !session) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/courses");

      if (!response.ok) {
        // Don't throw error for 401 (just not logged in)
        if (response.status === 401) {
          setCourses([]);
          return;
        }
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data.courses || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when authenticated
    if (status === "authenticated") {
      fetchCourses();
    }
  }, [status]);

  return { courses, loading, error, refetch: fetchCourses };
}
