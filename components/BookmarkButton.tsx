"use client";

import { useState, useEffect } from "react";

interface BookmarkButtonProps {
  lessonId: number;
}

export default function BookmarkButton({ lessonId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBookmark();
  }, [lessonId]);

  const checkBookmark = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      if (response.ok) {
        const bookmarks = await response.json();
        const bookmark = bookmarks.find((b: any) => b.lessonId === lessonId);
        if (bookmark) {
          setIsBookmarked(true);
          setBookmarkId(bookmark.id);
        }
      }
    } catch (error) {
      console.error("Error checking bookmark:", error);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsBookmarked(false);
          setBookmarkId(null);
        }
      } else {
        // Add bookmark
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        if (response.ok) {
          const bookmark = await response.json();
          setIsBookmarked(true);
          setBookmarkId(bookmark.id);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 rounded transition-colors ${
        isBookmarked
          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
    >
      {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}
