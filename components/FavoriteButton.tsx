"use client";

import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  courseId: number;
}

export default function FavoriteButton({ courseId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [courseId]);

  const checkFavorite = async () => {
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const favorites = await response.json();
        setIsFavorited(favorites.some((f: any) => f.id === courseId));
      }
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch(`/api/favorites/${courseId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsFavorited(false);
        }
      } else {
        // Add favorite
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        if (response.ok) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 rounded transition-colors ${
        isFavorited
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
      }`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? "❤️ Favorited" : "🤍 Favorite"}
    </button>
  );
}
