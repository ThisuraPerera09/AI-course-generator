"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

interface ExportButtonProps {
  readonly courseId: number;
}

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Lesson {
  id: number;
  order: number;
  title: string;
  content: string;
  duration?: string;
  quizzes?: Quiz[];
}

interface Course {
  id: number;
  title: string;
  description?: string;
  topic: string;
  level: string;
  duration?: string;
}

export default function ExportButton({ courseId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async (course: Course, lessons: Lesson[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    const addText = (
      text: string,
      fontSize: number = 12,
      isBold: boolean = false
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");

      const lines = doc.splitTextToSize(text, maxWidth);

      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5;
    };

    // Title
    addText(course.title, 20, true);
    yPosition += 5;

    // Course info
    addText(`Level: ${course.level}`, 12, true);
    addText(`Topic: ${course.topic}`, 12, true);
    if (course.duration) {
      addText(`Duration: ${course.duration}`, 12, true);
    }
    yPosition += 5;

    // Description
    if (course.description) {
      addText(course.description, 11);
      yPosition += 5;
    }

    // Lessons
    for (const lesson of lessons) {
      // Add page break if needed for new lesson
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      addText(`Lesson ${lesson.order}: ${lesson.title}`, 16, true);

      if (lesson.duration) {
        addText(`Duration: ${lesson.duration}`, 10);
      }

      addText(lesson.content, 11);
      yPosition += 5;

      // Quizzes
      if (lesson.quizzes && lesson.quizzes.length > 0) {
        addText("Quiz Questions", 14, true);

        lesson.quizzes.forEach((quiz, index) => {
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = margin;
          }

          addText(`${index + 1}. ${quiz.question}`, 11, true);

          quiz.options.forEach((option, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex);
            const isCorrect = optIndex === quiz.correctAnswer;
            addText(`   ${letter}. ${option}${isCorrect ? " ✓" : ""}`, 10);
          });

          if (quiz.explanation) {
            addText(`   Explanation: ${quiz.explanation}`, 10);
          }
          yPosition += 3;
        });
      }

      yPosition += 10;
    }

    // Save PDF
    const fileName = `${course.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    doc.save(fileName);
  };

  const handleExport = async (format: "pdf" | "markdown") => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/export?format=${format}`
      );

      if (format === "markdown") {
        const blob = await response.blob();
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `course-${courseId}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        globalThis.URL.revokeObjectURL(url);
      } else {
        // PDF export
        const data = await response.json();
        await generatePDF(data.course, data.lessons);
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
