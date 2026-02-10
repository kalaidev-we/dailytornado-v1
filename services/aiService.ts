import { GoogleGenAI } from "@google/genai";
import { Habit } from "../types";
import { EXPENSE_CATEGORIES } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Fallback messages in case API fails or key is missing
const FALLBACK_MOTIVATION = [
  "You are stronger than you think!",
  "Consistency is key. Keep going!",
  "Every step counts towards your goal.",
  "Small habits make big differences.",
  "Don't stop now, you're doing great!"
];

export const getMotivationalMessage = async (habit: Habit, context: 'reminder' | 'streak' | 'completion'): Promise<string> => {
  if (!apiKey) {
    console.warn("No API Key found, returning fallback motivation.");
    return FALLBACK_MOTIVATION[Math.floor(Math.random() * FALLBACK_MOTIVATION.length)];
  }

  try {
    let prompt = "";
    if (context === 'reminder') {
      prompt = `Generate a short, punchy, motivational push notification message (max 15 words) for a user who needs to do their habit: "${habit.title}". The habit description is "${habit.description}". Make it urgent but encouraging.`;
    } else if (context === 'streak') {
      prompt = `Generate a short, celebratory message (max 15 words) for a user who just reached a ${habit.streak}-day streak on their habit: "${habit.title}". Use emojis.`;
    } else {
      prompt = `Generate a short, rewarding message (max 15 words) for completing the task "${habit.title}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text?.trim() || "Keep pushing forward!";
  } catch (error) {
    console.error("Error fetching motivation from Gemini:", error);
    return FALLBACK_MOTIVATION[Math.floor(Math.random() * FALLBACK_MOTIVATION.length)];
  }
};

export const analyzeBillImage = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<{ title: string; amount: number; category: string } | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `Analyze this image of a receipt/bill. Extract the following information:
    1. Merchant Name (use as title)
    2. Total Amount (number)
    3. Best matching category from this list: ${EXPENSE_CATEGORIES.join(', ')}.

    Return a JSON object with keys: "title", "amount", "category".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing bill image:", error);
    return null;
  }
};