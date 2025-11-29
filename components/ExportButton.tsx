"use client";

import { useState } from "react";

interface ExportButtonProps {
  courseId: number;
}

export default function ExportButton({ courseId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: "pdf" | "markdown") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/export?format=${format}`);
      
      if (format === "markdown") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `course-${courseId}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For PDF, we'd need to generate it client-side
        // For now, just show a message
        alert("PDF export will be available soon. Please use Markdown export for now.");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport("markdown")}
        disabled={loading}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
      >
        {loading ? "Exporting..." : "Export as Markdown"}
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={loading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
      >
        Export as PDF
      </button>
    </div>
  );
}

