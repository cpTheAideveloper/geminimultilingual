// File: src/components/ui/FullscreenTextInput.tsx
"use client";

import { useState } from "react";

interface FullscreenTextInputProps {
  onSubmit: (text: string) => void;
}

export default function FullscreenTextInput({ onSubmit }: FullscreenTextInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0 || text.length > 140) return;
    onSubmit(text.trim());
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          placeholder="Enter text (max 140 characters)"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={5}
          required
        ></textarea>
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Translate
        </button>
      </form>
    </div>
  );
}