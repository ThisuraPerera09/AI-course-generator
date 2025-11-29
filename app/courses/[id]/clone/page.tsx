"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CloneCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      handleClone();
    }
  }, [params.id]);

  const handleClone = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/courses/${params.id}/clone`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/courses/${data.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to clone course");
      }
    } catch (err) {
      setError("An error occurred while cloning the course");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Cloning course...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600 dark:text-red-400 mb-4">
          {error}
        </div>
        <Link
          href="/public"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Public Gallery
        </Link>
      </div>
    );
  }

  return null;
}

