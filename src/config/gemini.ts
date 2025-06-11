import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getGeminiModel = async () => {
  // Changed model to Gemini 2.5 Flash Preview which is free and has good rate limits
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview" });
};

export const generateAIResponse = async (prompt: string) => {
  try {
    const model = await getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};