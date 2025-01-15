// File: src/components/ui/LanguageSelectionModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Language } from "@/types";

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguages: (languages: string[]) => void;
}

const COMMON_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "fr", name: "French" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "sw", name: "Swahili" },
  { code: "mwu", name: "Murrinh-Patha" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "it", name: "Italian" },
  { code: "ko", name: "Korean" },
  { code: "vi", name: "Vietnamese" },
  { code: "ta", name: "Tamil" },
];

export default function LanguageSelectionModal({
  isOpen,
  onClose,
  onSelectLanguages,
}: LanguageSelectionModalProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLanguages([]);
    }
  }, [isOpen]);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = () => {
    if (selectedLanguages.length === 3) {
      onSelectLanguages(selectedLanguages);
      onClose();
    }
  };

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-md p-6">
        <h2 className="text-xl mb-4">Select 3 Target Languages</h2>
        <div className="max-h-60 overflow-y-auto">
          {COMMON_LANGUAGES.map((lang) => (
            <label key={lang.code} className="block mb-2">
              <input
                type="checkbox"
                checked={selectedLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
                disabled={
                  !selectedLanguages.includes(lang.code) && selectedLanguages.length >= 3
                }
                className="mr-2"
              />
              {lang.name}
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedLanguages.length !== 3}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              selectedLanguages.length !== 3
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  ) : null;
}