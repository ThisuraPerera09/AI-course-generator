"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeDebug() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [htmlClass, setHtmlClass] = useState("");

  useEffect(() => {
    setMounted(true);
    // Check if dark class is on html element
    const checkHtmlClass = () => {
      if (typeof window !== "undefined") {
        setHtmlClass(document.documentElement.className);
      }
    };
    checkHtmlClass();
    const interval = setInterval(checkHtmlClass, 100);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg text-xs z-50">
      <div className="space-y-1">
        <div>
          <strong>Theme:</strong> {theme}
        </div>
        <div>
          <strong>Resolved:</strong> {resolvedTheme}
        </div>
        <div>
          <strong>HTML Class:</strong> {htmlClass || "(none)"}
        </div>
        <div>
          <strong>Has 'dark':</strong>{" "}
          {htmlClass.includes("dark") ? "✅ Yes" : "❌ No"}
        </div>
      </div>
    </div>
  );
}
