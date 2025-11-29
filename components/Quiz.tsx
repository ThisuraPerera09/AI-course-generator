"use client";

import { useState } from "react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  lessonTitle: string;
  lessonId?: number;
}

export default function Quiz({ questions, lessonTitle, lessonId }: QuizProps) {
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers, lessonId }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const data = await response.json();
      setResults(data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Quiz: {lessonTitle}
      </h3>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = submitted && userAnswer === question.correctAnswer;
          const showResult = submitted && userAnswer !== undefined;

          return (
            <div
              key={question.id}
              className={`p-4 rounded-lg border-2 ${
                showResult
                  ? isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-white mb-3">
                {index + 1}. {question.question}
              </p>

              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = userAnswer === optionIndex;
                  const isCorrectOption =
                    optionIndex === question.correctAnswer;

                  return (
                    <label
                      key={optionIndex}
                      className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                        submitted
                          ? isCorrectOption
                            ? "bg-green-100 dark:bg-green-900/30"
                            : isSelected && !isCorrect
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-gray-50 dark:bg-gray-700"
                          : isSelected
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optionIndex}
                        checked={isSelected}
                        onChange={() =>
                          handleAnswerChange(question.id, optionIndex)
                        }
                        disabled={submitted}
                        className="mr-3"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                      {submitted && isCorrectOption && (
                        <span className="ml-auto text-green-600 dark:text-green-400 font-semibold">
                          ✓ Correct
                        </span>
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <span className="ml-auto text-red-600 dark:text-red-400 font-semibold">
                          ✗ Wrong
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {submitted && question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Explanation:</span>{" "}
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={
              loading || Object.keys(answers).length !== questions.length
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Submitting..." : "Submit Quiz"}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            {Object.keys(answers).length} of {questions.length} questions
            answered
          </p>
        </div>
      ) : (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="text-center">
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Results
            </h4>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {results?.score}%
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              You got {results?.correctCount} out of {results?.totalCount}{" "}
              questions correct!
            </p>
            <button
              onClick={handleReset}
              className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
