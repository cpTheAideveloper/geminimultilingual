// File: src/app/page.tsx
"use client";

import { useState } from "react";
import FullscreenTextInput from "@/components/ui/FullscreenTextInput";
import LanguageSelectionModal from "@/components/ui/LanguageSelectionModal";
import TranslationDisplay from "@/components/ui/TranslationDisplay";

export default function Home() {
  const [inputText, setInputText] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, string> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextSubmit = (text: string) => {
    setInputText(text);
    setIsModalOpen(true);
  };

  const handleLanguagesSubmit = async (languages: string[]) => {
    setSelectedLanguages(languages);
    setIsModalOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText, targetLanguages: languages }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An unexpected error occurred.");
        setIsLoading(false);
        return;
      }

      setTranslations(data.translations);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to fetch translations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setInputText("");
    setSelectedLanguages([]);
    setTranslations(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {!translations && !isLoading && (
        <FullscreenTextInput onSubmit={handleTextSubmit} />
      )}

      {isLoading && (
        <div className="text-center">
          <p className="text-lg">Translating...</p>
        </div>
      )}

      {translations && (
        <TranslationDisplay
          translations={translations}
          onStartOver={handleStartOver}
        />
      )}

      <LanguageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectLanguages={handleLanguagesSubmit}
      />

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}