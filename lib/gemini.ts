import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let cachedModels: string[] | null = null;

export async function listAvailableModels(): Promise<string[]> {
  if (cachedModels !== null && cachedModels.length > 0) {
    return cachedModels;
  }

  try {
    // Try v1beta endpoint first (newer)
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    // If that fails, try v1 endpoint
    if (!response.ok) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
      );
    }

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    cachedModels = models;
    return models;
  } catch {
    // Return empty array if model listing fails - will use default models
    return [];
  }
}

export interface CourseGenerationRequest {
  topic: string;
  level: "beginner" | "intermediate" | "advanced" | string;
  duration?: string;
  lessonCount?: number; // Optional: specify desired number of lessons
}

export interface QuizQuestion {
  question: string;
  options: string[]; // Array of 4 options
  correctAnswer: number; // Index of correct answer (0-based)
  explanation?: string; // Explanation for the correct answer
}

export interface Lesson {
  title: string;
  content: string;
  order: number;
  duration?: string;
  quiz?: QuizQuestion[]; // Optional quiz questions for this lesson
}

export interface GeneratedCourse {
  title: string;
  description: string;
  lessons: Lesson[];
}

/**
 * Validates the generated course structure
 */
function validateCourse(data: any): data is GeneratedCourse {
  return (
    data &&
    typeof data.title === "string" &&
    data.title.length > 0 &&
    typeof data.description === "string" &&
    data.description.length > 0 &&
    Array.isArray(data.lessons) &&
    data.lessons.length > 0 &&
    data.lessons.every(
      (lesson: any) =>
        typeof lesson.title === "string" &&
        typeof lesson.content === "string" &&
        typeof lesson.order === "number" &&
        lesson.content.length > 50 // Ensure meaningful content
    )
  );
}

/**
 * Extracts JSON from AI response text
 */
function extractJSON(text: string): any {
  let cleanText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generates a comprehensive course using Google's Gemini AI
 */
export async function generateCourse(
  request: CourseGenerationRequest
): Promise<GeneratedCourse> {
  let modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-latest",
  ];

  try {
    const availableModels = await listAvailableModels();
    if (availableModels.length > 0) {
      const modelNames = availableModels
        .map((m) => m.replace("models/", ""))
        .filter((m) => m.includes("gemini"));

      if (modelNames.length > 0) {
        modelsToTry = modelNames;
      }
    }
  } catch {}

  const lessonCount = request.lessonCount || 6;

  const prompt = `Generate a comprehensive ${request.level} level course on "${
    request.topic
  }".
${
  request.duration
    ? `The course should be approximately ${request.duration}.`
    : ""
}

Please provide a structured course with:
1. A compelling course title (concise and descriptive)
2. A detailed course description (2-3 paragraphs explaining what students will learn and why it matters)
3. Exactly ${lessonCount} lessons with:
   - Clear, descriptive lesson title
   - Comprehensive lesson content (detailed explanations, examples, key concepts, and practical applications)
   - Sequential lesson order (starting from 1)
   - Realistic estimated duration for each lesson
   - Quiz questions: 3-5 multiple choice questions per lesson to test understanding

IMPORTANT: Respond ONLY with a valid JSON object. No additional text before or after.

JSON structure:
{
  "title": "Course Title Here",
  "description": "Detailed course description...",
  "lessons": [
    {
      "title": "Lesson 1: Introduction",
      "content": "Comprehensive lesson content with explanations and examples...",
      "order": 1,
      "duration": "30 minutes",
      "quiz": [
        {
          "question": "What is the main topic of this lesson?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation of why this is correct"
        }
      ]
    }
  ]
}

For each quiz question:
- Provide 4 multiple choice options
- Set correctAnswer as the index (0-3) of the correct option
- Include a brief explanation for the correct answer
- Make questions relevant to the lesson content

Ensure content is educational, well-structured, and appropriate for ${
    request.level
  } level learners.
Include real-world examples and practical applications in each lesson.`;

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const courseData = extractJSON(text);

      if (!validateCourse(courseData)) {
        throw new Error("Invalid or incomplete course structure from AI");
      }

      return courseData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model - error will be thrown if all models fail
    }
  }

  // Build error message parts
  const lastErrorMsg = lastError ? lastError.message : "";
  const modelsAttempted = modelsToTry.join(", ");

  try {
    const availableModels = await listAvailableModels();

    if (availableModels.length > 0) {
      const availableNames = availableModels
        .map((m) => m.replace("models/", ""))
        .join(", ");

      const errorParts = [
        "Course generation failed: None of the standard models worked.",
        "",
        `Models attempted: ${modelsAttempted}`,
        `Models available to your API key: ${availableNames}`,
        "",
      ];

      if (lastErrorMsg) {
        errorParts.push(`Last error: ${lastErrorMsg}`, "");
      }

      errorParts.push(
        "Suggestions:",
        "1. Update modelsToTry array in lib/gemini.ts with available models",
        "2. Verify API quota at https://aistudio.google.com/",
        "3. Check API key permissions in Google Cloud Console"
      );

      throw new Error(errorParts.join("\n"));
    } else {
      const errorParts = [
        "Course generation failed: Could not access Gemini API.",
        "",
      ];

      if (lastErrorMsg) {
        errorParts.push(`Error: ${lastErrorMsg}`, "");
      }

      errorParts.push(
        "Please verify:",
        "1. GEMINI_API_KEY is correct and active",
        "2. Generative Language API is enabled: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com",
        "3. API key has necessary permissions",
        "4. You haven't exceeded API quotas",
        "5. Check Google AI Studio: https://aistudio.google.com/"
      );

      throw new Error(errorParts.join("\n"));
    }
  } catch (diagError) {
    const errorParts = ["Course generation failed with all models."];

    if (lastErrorMsg) {
      errorParts.push(`Last error: ${lastErrorMsg}`);
    }

    // Include diagnostic error information if it provides additional context
    if (
      diagError instanceof Error &&
      diagError.message &&
      diagError.message !== lastErrorMsg
    ) {
      errorParts.push(`Diagnostic error: ${diagError.message}`);
    }

    errorParts.push("Please check your API key and network connection.");

    throw new Error(errorParts.join("\n"));
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'OK' if you can hear me.");
    const text = result.response.text();
    return text.length > 0;
  } catch {
    return false;
  }
}
