import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models for this key:");
    models.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

listModels();
