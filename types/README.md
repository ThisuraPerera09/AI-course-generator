# TypeScript Types

This directory contains all TypeScript type definitions and interfaces for the AI Course Generator application.

## Overview

All types are centralized in `/types/index.ts` for easy import and maintenance.

## Available Types

### Course Types

```typescript
interface Course {
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

interface NewCourse {
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
```

### Lesson Types

```typescript
interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  order: number;
  duration?: string;
  createdAt: Date;
}

interface LessonProgress {
  lessonId: number;
  completedAt: Date | null;
  quizScore: number | null;
}
```

### Quiz Types

```typescript
interface Quiz {
  id: number;
  lessonId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  order: number;
  createdAt: Date;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizResults {
  results: QuizResult[];
  score: number;
  correctCount: number;
  totalCount: number;
}
```

### SRS Review Types

```typescript
type ReviewStatus = "new" | "learning" | "reviewing" | "mastered";

interface QuizReview {
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

interface ReviewStats {
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
```

### User & Progress Types

```typescript
interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProgress {
  id: number;
  userId: string;
  lessonId: number;
  completedAt: Date | null;
  quizScore: number | null;
  updatedAt: Date;
}

interface Analytics {
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
```

### Feature Types

```typescript
interface Note {
  id: number;
  userId: string;
  lessonId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Bookmark {
  id: number;
  userId: string;
  lessonId: number;
  title?: string;
  note?: string;
  createdAt: Date;
}

interface Favorite {
  id: number;
  userId: string;
  courseId: number;
  createdAt: Date;
}
```

### API Response Types

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## Usage Examples

### Import Types

```typescript
// Single import
import type { Course, Lesson } from "@/types";

// Multiple imports
import type { 
  QuizReview, 
  ReviewStatus, 
  ReviewStats 
} from "@/types";
```

### Using in Components

```typescript
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  onSelect: (id: number) => void;
}

function CourseCard({ course, onSelect }: CourseCardProps) {
  return (
    <div onClick={() => onSelect(course.id)}>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
    </div>
  );
}
```

### Using in API Routes

```typescript
import type { ApiResponse, Course } from "@/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<ApiResponse<Course[]>>> {
  try {
    const courses = await fetchCourses();
    return NextResponse.json({ data: courses });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to fetch courses" 
    }, { status: 500 });
  }
}
```

### Using with Hooks

```typescript
import type { ReviewStats } from "@/types";
import { useState, useEffect } from "react";

function useReviewStats() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  
  useEffect(() => {
    fetchStats().then(setStats);
  }, []);
  
  return stats;
}
```

## Type Naming Conventions

- **Interfaces**: PascalCase (e.g., `Course`, `QuizReview`)
- **Types**: PascalCase (e.g., `ReviewStatus`)
- **Props**: Component name + "Props" (e.g., `CourseCardProps`)
- **API Responses**: Feature + "Response" (e.g., `ApiResponse`)
- **New/Create**: "New" + Entity (e.g., `NewCourse`, `NewLesson`)

## Best Practices

1. **Use `interface` for objects**, `type` for unions/primitives
2. **Make optional fields explicit** with `?` or `| null`
3. **Avoid `any`** - use `unknown` if type is truly unknown
4. **Reuse types** - Don't duplicate similar interfaces
5. **Export from index.ts** - Single source of truth
6. **Document complex types** with JSDoc comments
7. **Use discriminated unions** for status/state types

## Adding New Types

When adding new types:

1. Add to `/types/index.ts`
2. Use clear, descriptive names
3. Add JSDoc comments for complex types
4. Export immediately
5. Update this README if it's a major addition

## Type Utilities

```typescript
// Partial type (all fields optional)
type PartialCourse = Partial<Course>;

// Pick specific fields
type CoursePreview = Pick<Course, "id" | "title" | "topic">;

// Omit specific fields
type CourseWithoutDates = Omit<Course, "createdAt" | "updatedAt">;

// Make specific fields required
type RequiredCourse = Required<Course>;
```

## Database vs. API Types

- **Database types**: Match schema exactly (may include nulls)
- **API types**: May transform nulls to undefined for TypeScript
- **Component props**: Should be as strict as possible

## Migration Guide

If database schema changes:

1. Update types in `/types/index.ts`
2. Update database schema in `/lib/db/schema.ts`
3. Generate migration: `npm run db:generate`
4. Run migration: `npm run db:migrate`
5. Update affected components
6. Test thoroughly

---

**Last Updated**: January 2026

