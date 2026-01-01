import { useState } from "react";

/**
 * Custom hook for managing localStorage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (globalThis.window === undefined) {
      return initialValue;
    }

    try {
      const item = globalThis.window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        typeof value === "function"
          ? (value as (val: T) => T)(storedValue)
          : value;

      setStoredValue(valueToStore);

      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem(
          key,
          JSON.stringify(valueToStore)
        );
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
