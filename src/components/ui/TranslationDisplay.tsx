// File: src/components/ui/TranslationDisplay.tsx
"use client";

import { TranslationResult } from "@/types";

interface TranslationDisplayProps {
  translations: TranslationResult;
  onStartOver: () => void;
}

export default function TranslationDisplay({
  translations,
  onStartOver,
}: TranslationDisplayProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Translations</h2>
      <ul className="space-y-2">
        {Object.entries(translations).map(([lang, text]) => (
          <li key={lang} className="flex items-center">
            <span className="font-semibold mr-2">{lang.toUpperCase()}:</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onStartOver}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        Start Over
      </button>
    </div>
  );
}