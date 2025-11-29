"use client";

import { useState, useEffect } from "react";

interface ReadingModeProps {
  content: string;
  title: string;
}

export default function ReadingMode({ content, title }: ReadingModeProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
      if (e.key === "Escape" && isActive) {
        setIsActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isActive]);

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center gap-2"
        title="Enter reading mode (Ctrl/Cmd + R)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Reading Mode
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <button
            onClick={() => setIsActive(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
          >
            Exit Reading Mode (Esc)
          </button>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed text-lg">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

