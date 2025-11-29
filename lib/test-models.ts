import { GoogleGenerativeAI } from "@google/generative-ai";

// Test script to find available models
export async function testAvailableModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Common model names to try
  const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-thinking-exp",
  ];

  console.log("Testing available models...\n");

  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say 'test'");
      const response = await result.response;
      const text = response.text();
      console.log(
        `✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}...`
      );
      return modelName; // Return first working model
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        console.log(`❌ ${modelName} - Not found (404)`);
      } else {
        console.log(`⚠️  ${modelName} - Error: ${errorMsg.substring(0, 100)}`);
      }
    }
  }

  console.log(
    "\nNo working models found. Please check your API key permissions."
  );
  return null;
}
