"use client";

import { useState } from "react";

interface ShareButtonProps {
  courseId: number;
  shareToken: string | null;
  isPublic: boolean;
  onToggle: (isPublic: boolean, shareToken: string | null) => void;
}

export default function ShareButton({
  courseId,
  shareToken,
  isPublic,
  onToggle,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok) {
        const data = await response.json();
        onToggle(data.isPublic, data.shareToken ?? null);
      }
    } catch (error) {
      console.error("Error toggling share:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={handleToggle}
          disabled={loading}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Make Public
        </span>
      </label>
      {isPublic && shareUrl && (
        <button
          onClick={handleCopyLink}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      )}
    </div>
  );
}
