// File: src/app/api/translate/route.ts
import { NextResponse } from "next/server";
import { translateText } from "@/utils/gemini";
import { TranslationResult } from "@/types";

interface TranslateRequestBody {
  text: string;
  targetLanguages: string[];
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguages } = (await request.json()) as TranslateRequestBody;

    if (!text || text.length > 140) {
      return NextResponse.json(
        { error: "Text is required and must be up to 140 characters." },
        { status: 400 }
      );
    }

    if (!targetLanguages || targetLanguages.length !== 3) {
      return NextResponse.json(
        { error: "Please select exactly 3 target languages." },
        { status: 400 }
      );
    }

    const translations: TranslationResult = await translateText(text, targetLanguages);

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("API Translation Error:", error);
    return NextResponse.json(
      { error: "An error occurred during translation." },
      { status: 500 }
    );
  }
}