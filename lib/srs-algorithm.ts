/**
 * Spaced Repetition System (SRS) Algorithm
 * Based on the SM-2 (SuperMemo 2) algorithm
 * Used for calculating optimal review intervals
 */

export interface ReviewSchedule {
  nextReviewDate: Date;
  interval: number; // in days
  easeFactor: number;
  status: "new" | "learning" | "reviewing" | "mastered";
}

export interface ReviewInput {
  score: number; // 0-100
  currentInterval: number; // in days
  reviewCount: number;
  easeFactor: number; // 100-300 (represents 1.0-3.0)
  lastReviewDate?: Date;
}

/**
 * Calculate the next review schedule based on quiz performance
 * Uses modified SM-2 algorithm optimized for quiz-based learning
 */
export function calculateNextReview(input: ReviewInput): ReviewSchedule {
  const { score, currentInterval, reviewCount, easeFactor } = input;

  // Convert score (0-100) to quality (0-5) for SM-2 algorithm
  const quality = scoreToQuality(score);

  // Calculate new ease factor
  let newEaseFactor = calculateEaseFactor(easeFactor, quality);

  // Ensure ease factor stays within reasonable bounds
  newEaseFactor = Math.max(130, Math.min(300, newEaseFactor));

  // Calculate next interval based on quality
  let nextInterval: number;

  if (quality < 3) {
    // Failed recall - restart with short interval
    nextInterval = 1;
  } else {
    // Successful recall - calculate next interval
    if (reviewCount === 0) {
      nextInterval = 1; // First review: 1 day
    } else if (reviewCount === 1) {
      nextInterval = 3; // Second review: 3 days
    } else {
      // Subsequent reviews: use ease factor
      nextInterval = Math.round(currentInterval * (newEaseFactor / 100));
    }
  }

  // Cap maximum interval at 180 days (6 months)
  nextInterval = Math.min(nextInterval, 180);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  // Determine status based on performance and review count
  const status = determineStatus(score, reviewCount);

  return {
    nextReviewDate,
    interval: nextInterval,
    easeFactor: newEaseFactor,
    status,
  };
}

/**
 * Convert percentage score (0-100) to SM-2 quality rating (0-5)
 */
function scoreToQuality(score: number): number {
  if (score >= 95) return 5; // Perfect
  if (score >= 85) return 4; // Good
  if (score >= 70) return 3; // Pass
  if (score >= 60) return 2; // Hard
  if (score >= 50) return 1; // Very hard
  return 0; // Failed
}

/**
 * Calculate new ease factor using SM-2 algorithm
 */
function calculateEaseFactor(
  currentEaseFactor: number,
  quality: number
): number {
  // SM-2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const ef = currentEaseFactor / 100; // Convert to decimal (1.3-3.0)
  const newEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Convert back to integer (130-300)
  return Math.round(newEf * 100);
}

/**
 * Determine learning status based on performance
 */
function determineStatus(
  score: number,
  reviewCount: number
): "new" | "learning" | "reviewing" | "mastered" {
  if (reviewCount === 0) return "new";

  if (score >= 95 && reviewCount >= 4) {
    return "mastered"; // Consistently excellent performance
  } else if (score >= 85 && reviewCount >= 2) {
    return "reviewing"; // Good performance, in review phase
  } else {
    return "learning"; // Still learning the material
  }
}

/**
 * Calculate retention rate based on review history
 */
export function calculateRetentionRate(scores: number[]): number {
  if (scores.length === 0) return 100;

  // Calculate weighted average favoring recent scores
  let totalWeight = 0;
  let weightedSum = 0;

  scores.forEach((score, index) => {
    // More recent scores have higher weight
    const weight = index + 1;
    weightedSum += score * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate average score from review history
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Get reviews due today
 */
export function getReviewsDueToday(reviews: Array<{ nextReviewDate: Date }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return reviews.filter((review) => {
    const reviewDate = new Date(review.nextReviewDate);
    return reviewDate >= today && reviewDate < tomorrow;
  });
}

/**
 * Get overdue reviews
 */
export function getOverdueReviews(reviews: Array<{ nextReviewDate: Date }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reviews.filter((review) => {
    const reviewDate = new Date(review.nextReviewDate);
    return reviewDate < today;
  });
}

/**
 * Get upcoming reviews (next 7 days)
 */
export function getUpcomingReviews(reviews: Array<{ nextReviewDate: Date }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return reviews.filter((review) => {
    const reviewDate = new Date(review.nextReviewDate);
    return reviewDate > today && reviewDate <= nextWeek;
  });
}

/**
 * Calculate study streak (consecutive days with reviews)
 */
export function calculateStudyStreak(
  reviewDates: Date[]
): { current: number; longest: number } {
  if (reviewDates.length === 0) return { current: 0, longest: 0 };

  // Sort dates in descending order
  const sortedDates = reviewDates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a review today or yesterday
  const lastReview = new Date(sortedDates[0]);
  lastReview.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 1) {
    // Streak is broken
    currentStreak = 0;
  } else {
    currentStreak = 1;

    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      current.setHours(0, 0, 0, 0);

      const previous = new Date(sortedDates[i - 1]);
      previous.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        currentStreak++;
        tempStreak++;
      } else if (diff === 0) {
        // Same day, continue
        continue;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get motivation message based on status
 */
export function getMotivationMessage(
  status: string,
  reviewCount: number,
  score: number
): string {
  if (status === "mastered") {
    return "🎉 Mastered! You've got this down!";
  } else if (status === "reviewing" && score >= 90) {
    return "⭐ Excellent! Almost mastered!";
  } else if (status === "reviewing") {
    return "💪 Keep it up! You're making progress!";
  } else if (reviewCount === 0) {
    return "🌱 New material - let's learn this!";
  } else if (score >= 70) {
    return "📚 Good job! Keep reviewing!";
  } else {
    return "🔄 Don't give up! Practice makes perfect!";
  }
}

