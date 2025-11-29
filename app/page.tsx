"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Generate AI-Powered Courses
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Create comprehensive, structured courses on any topic using AI
        </p>
        {session ? (
          <Link
            href="/generate"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Generate New Course
          </Link>
        ) : (
          <div className="space-x-4">
            <Link
              href="/auth/signup"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            AI-Powered
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Leverage Google Gemini AI to generate comprehensive course content
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Structured Learning
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get well-organized courses with lessons, content, and learning paths
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Customizable
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your topic, difficulty level, and course duration
          </p>
        </div>
      </div>
    </div>
  );
}
