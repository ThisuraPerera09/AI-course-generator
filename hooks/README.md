# Custom Hooks

This directory contains reusable React hooks for the AI Course Generator application.

## Available Hooks

### `useReviewStats(autoRefresh?)`
Fetches and manages SRS review statistics with automatic refresh.

**Authentication:** Only fetches when user is authenticated. Safe to use in any component.

**Parameters:**
- `autoRefresh` (boolean, optional): Enable auto-refresh every 5 minutes (default: `true`)

**Returns:**
- `stats`: Review statistics object
- `loading`: Loading state
- `error`: Error message if any
- `refetch`: Function to manually refresh data

**Example:**
```tsx
import { useReviewStats } from "@/hooks";

function MyComponent() {
  const { stats, loading, error } = useReviewStats();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Due today: {stats.dueToday}</div>;
}
```

---

### `useReviews(filter)`
Fetches quiz reviews with filtering support.

**Parameters:**
- `filter`: `"due" | "overdue" | "upcoming" | "all"`

**Returns:**
- `reviews`: Array of reviews with lesson and course details
- `loading`: Loading state
- `error`: Error message if any
- `refetch`: Function to manually refresh data

**Example:**
```tsx
import { useReviews } from "@/hooks";

function ReviewList() {
  const { reviews, loading } = useReviews("due");
  
  return (
    <div>
      {reviews.map(item => (
        <div key={item.review.id}>
          {item.lesson.title}
        </div>
      ))}
    </div>
  );
}
```

---

### `useCourses()`
Fetches user's courses.

**Returns:**
- `courses`: Array of courses
- `loading`: Loading state
- `error`: Error message if any
- `refetch`: Function to manually refresh data

**Example:**
```tsx
import { useCourses } from "@/hooks";

function CourseList() {
  const { courses, loading } = useCourses();
  
  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

---

### `useLocalStorage(key, initialValue)`
Manages state synchronized with localStorage.

**Parameters:**
- `key`: localStorage key
- `initialValue`: Default value if key doesn't exist

**Returns:**
- `[value, setValue]`: Similar to `useState` API

**Example:**
```tsx
import { useLocalStorage } from "@/hooks";

function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle Theme
    </button>
  );
}
```

---

### `useAsync()`
Handles async operations with loading and error states.

**Returns:**
- `data`: Response data
- `loading`: Loading state
- `error`: Error message if any
- `execute`: Function to run async operation
- `reset`: Function to reset state

**Example:**
```tsx
import { useAsync } from "@/hooks";

function DataFetcher() {
  const { data, loading, error, execute } = useAsync();
  
  const handleFetch = () => {
    execute(async () => {
      const res = await fetch("/api/data");
      return res.json();
    });
  };
  
  return <button onClick={handleFetch}>Fetch Data</button>;
}
```

---

### `useMediaQuery(query)`
Detects if a media query matches.

**Parameters:**
- `query`: CSS media query string

**Returns:**
- `matches`: Boolean indicating if query matches

**Example:**
```tsx
import { useMediaQuery, useIsMobile } from "@/hooks";

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isLargeScreen = useMediaQuery("(min-width: 1920px)");
  
  return <div>{isMobile ? "Mobile" : "Desktop"}</div>;
}
```

**Helper Hooks:**
- `useIsMobile()`: max-width: 768px
- `useIsTablet()`: 769px - 1024px
- `useIsDesktop()`: min-width: 1025px

---

### `useInterval(callback, delay)`
Runs a callback at specified intervals.

**Parameters:**
- `callback`: Function to run
- `delay`: Interval in milliseconds (null to pause)

**Example:**
```tsx
import { useInterval } from "@/hooks";
import { useState } from "react";

function Timer() {
  const [count, setCount] = useState(0);
  
  useInterval(() => {
    setCount(count + 1);
  }, 1000);
  
  return <div>{count} seconds</div>;
}
```

---

## Best Practices

1. **Always handle loading and error states** when using data-fetching hooks
2. **Use `refetch` to manually refresh** when needed (e.g., after mutations)
3. **Clean up effects** - hooks handle this automatically
4. **Type safety** - All hooks are fully typed with TypeScript
5. **Memoization** - Hooks use `useCallback` and `useMemo` where appropriate

## Adding New Hooks

When adding a new hook:

1. Create a new file in `/hooks` directory
2. Export the hook function
3. Add TypeScript types
4. Include JSDoc comments
5. Add to `/hooks/index.ts` exports
6. Update this README with documentation

## Import Example

```tsx
// Named imports (recommended)
import { useReviewStats, useLocalStorage } from "@/hooks";

// Individual imports
import { useReviewStats } from "@/hooks/useReviewStats";
```

