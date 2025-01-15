// File: src/utils/gemini.ts
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { TranslationResult } from "@/types";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    'Format the translation results as JSON with language codes as keys and translated texts as values. Example: {"es":"Hola", "fr":"Bonjour"}',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  responseMimeType: "application/json",
};

const promptTemplate = (userMessage: string, targetLanguages: string[]) =>
  `Translate the following text: "${userMessage}" into the following languages: ${targetLanguages.join(
    ", "
  )}. Provide the translations as a JSON object with language codes as keys and translated texts as values.`;

export async function translateText(
  userMessage: string,
  targetLanguages: string[]
): Promise<TranslationResult> {
  const prompt = promptTemplate(userMessage, targetLanguages);

  const chatSession = model.startChat({
    generationConfig,
  });

  try {
    const result = await chatSession.sendMessage(prompt);
    const responseText = await result.response.text();
    const translations: TranslationResult = JSON.parse(responseText);
    return translations;
  } catch (error) {
    console.error("Error during translation:", error);
    throw new Error("Translation failed");
  }
}