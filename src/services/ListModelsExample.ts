import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key not found.');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const models = await genAI.listModels();
    console.log('Available models:', models);
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
