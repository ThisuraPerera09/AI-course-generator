// Course related types
export interface Course {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  topic: string;
  level: string;
  duration: string | null;
  thumbnail: string | null;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCourse {
  userId: string;
  title: string;
  description?: string;
  topic: string;
  level: string;
  duration?: string;
  thumbnail?: string;
  isPublic?: boolean;
  shareToken?: string;
}

// Lesson related types
export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  order: number;
  duration?: string;
  createdAt: Date;
}

export interface NewLesson {
  courseId: number;
  title: string;
  content: string;
  order: number;
  duration?: string;
}

// Quiz related types
export interface Quiz {
  id: number;
  lessonId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  order: number;
  createdAt: Date;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: number;
  userId: string;
  quizId: number;
  score: number;
  correctCount: number;
  totalCount: number;
  answers: string;
  attemptedAt: Date;
}

export interface QuizSubmission {
  answers: { [key: number]: number };
  lessonId?: number;
}

export interface QuizResult {
  quizId: number;
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation?: string;
  options: string[];
}

export interface QuizResults {
  results: QuizResult[];
  score: number;
  correctCount: number;
  totalCount: number;
}

// Progress related types
export interface UserProgress {
  id: number;
  userId: string;
  lessonId: number;
  completedAt: Date | null;
  quizScore: number | null;
  updatedAt: Date;
}

export interface LessonProgress {
  lessonId: number;
  completedAt: Date | null;
  quizScore: number | null;
}

// Review (SRS) related types
export interface QuizReview {
  id: number;
  userId: string;
  lessonId: number;
  lastAttemptId: number | null;
  nextReviewDate: Date;
  reviewCount: number;
  currentInterval: number;
  lastScore: number;
  averageScore: number;
  retentionRate: number;
  status: ReviewStatus;
  easeFactor: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewStatus = "new" | "learning" | "reviewing" | "mastered";

export interface ReviewWithDetails {
  review: QuizReview;
  lesson: Lesson;
  course: Course;
}

export interface ReviewStats {
  total: number;
  statusCounts: {
    new: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
  dueToday: number;
  overdue: number;
  upcoming: number;
  avgRetention: number;
  avgScore: number;
  streak: {
    current: number;
    longest: number;
  };
}

// Note related types
export interface Note {
  id: number;
  userId: string;
  lessonId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bookmark related types
export interface Bookmark {
  id: number;
  userId: string;
  lessonId: number;
  title?: string;
  note?: string;
  createdAt: Date;
}

// Favorite related types
export interface Favorite {
  id: number;
  userId: string;
  courseId: number;
  createdAt: Date;
}

// Analytics related types
export interface Analytics {
  totalCourses: number;
  completedCourses: number;
  averageQuizScore: number;
  learningStreak: number;
  totalTimeSpent: number;
  recentActivity: number;
  stats: {
    totalQuizzes: number;
    totalLessonsCompleted: number;
  };
}

// User related types
export interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
