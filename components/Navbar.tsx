"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [reviewCount, setReviewCount] = useState(0);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
    router.refresh();
  };

  useEffect(() => {
    if (session) {
      fetchReviewCount();
      // Refresh count every 5 minutes
      const interval = setInterval(fetchReviewCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchReviewCount = async () => {
    try {
      const response = await fetch("/api/reviews/stats");
      if (response.ok) {
        const data = await response.json();
        setReviewCount(data.dueToday + data.overdue);
      }
    } catch (error) {
      console.error("Error fetching review count:", error);
    }
  };

  const getLinkClassName = (path: string) => {
    const isActive = pathname === path;
    return `${
      isActive
        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    } px-3 py-2 rounded-md text-sm font-medium transition-colors`;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              AI Course Generator
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <span className="text-gray-600 dark:text-gray-400">
                Loading...
              </span>
            ) : session ? (
              <>
                <Link href="/" className={getLinkClassName("/")}>
                  Home
                </Link>
                <Link href="/courses" className={getLinkClassName("/courses")}>
                  My Courses
                </Link>
                <Link
                  href="/generate"
                  className={getLinkClassName("/generate")}
                >
                  Generate
                </Link>
                <Link href="/public" className={getLinkClassName("/public")}>
                  Public Gallery
                </Link>
                <Link
                  href="/favorites"
                  className={getLinkClassName("/favorites")}
                >
                  Favorites
                </Link>
                <Link
                  href="/dashboard"
                  className={getLinkClassName("/dashboard")}
                >
                  Dashboard
                </Link>
                <Link href="/reviews" className={getLinkClassName("/reviews")}>
                  <div className="flex items-center gap-2">
                    <span>Reviews</span>
                    {reviewCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
                        {reviewCount > 99 ? "99+" : reviewCount}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <KeyboardShortcuts />
    </nav>
  );
}
