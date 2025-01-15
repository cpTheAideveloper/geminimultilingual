# Comprehensive Guide to Building a Multiple-Translation Application with Next.js 15, TypeScript, and TailwindCSS

## Table of Contents
1. [Project Setup](#1-project-setup)
2. [API and Backend Development](#2-api-and-backend-development)
   - [2.1. Define Utility Functions](#21-define-utility-functions)
   - [2.2. Implement API Routes](#22-implement-api-routes)
   - [2.3. Integrate Google Gemini API](#23-integrate-google-gemini-api)
3. [Frontend Development](#3-frontend-development)
   - [3.1. Building Reusable Components](#31-building-reusable-components)
      - [3.1.1. Fullscreen Text Input](#311-fullscreen-text-input)
      - [3.1.2. Language Selection Modal](#312-language-selection-modal)
      - [3.1.3. Translation Display](#313-translation-display)
4. [Integrating Frontend with Backend](#4-integrating-frontend-with-backend)
5. [Testing and Validation](#5-testing-and-validation)
6. [Finalizing the Application](#6-finalizing-the-application)

---

## 1. Project Setup

### 1.1. Initialize the Next.js Project
Start by creating a new Next.js project using TypeScript and TailwindCSS.

```bash
npx create-next-app@latest multiple-translation-app --typescript
cd multiple-translation-app
```

*Press `Enter` to use the default settings during setup.*

### 1.2. Install Necessary Dependencies
Install the Google Gemini SDK and any other essential dependencies.

```bash
npm install @google/generative-ai
```

*Note: Avoid installing Axios as we will use the Fetch API for HTTP requests.*

### 1.3. Configure TailwindCSS
Next.js comes with TailwindCSS pre-configured. Ensure that TailwindCSS is properly set up by verifying the presence of `tailwind.config.js` and relevant Tailwind directives in your CSS files.

```bash
# If TailwindCSS is not set up, initialize it
npx tailwindcss init -p
```

Ensure your `tailwind.config.js` includes the paths to your files:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust according to your project structure
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 1.4. Set Up Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API key.

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

*Next.js natively supports environment variables; no need for additional packages.*

### 1.5. Define TypeScript Types
Create a `types` directory within `src/` and add a `index.d.ts` file for shared types.

```bash
mkdir src/types
touch src/types/index.d.ts
```

**Example `src/types/index.d.ts`:**

```typescript
export interface TranslationResult {
  [languageCode: string]: string;
}

export type Language = {
  code: string;
  name: string;
};
```

---

## 2. API and Backend Development

Begin by developing the backend logic and API routes before moving to the frontend.

### 2.1. Define Utility Functions

Create utility functions to handle interactions with the Google Gemini API.

**File:** `src/utils/gemini.ts`

```typescript
// src/utils/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
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
```

**Explanation:**
- **System Instruction:** Specifies that the response should be a JSON object with language codes as keys and translated texts as values.
- **Prompt Template:** Constructs a prompt that instructs the AI to translate user input into the selected target languages.
- **translateText Function:** Sends the prompt to the Gemini model and parses the JSON response.

### 2.2. Implement API Routes

Create an API route to handle translation requests.

**File:** `src/app/api/translate/route.ts`

```typescript
// src/app/api/translate/route.ts
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
```

**Explanation:**
- **Endpoint:** `POST /api/translate`
- **Request Body:** Expects `text` (string up to 140 characters) and `targetLanguages` (array of exactly 3 language codes).
- **Response:** Returns the `translations` as a JSON object.
- **Error Handling:** Validates input and handles potential errors during translation.

### 2.3. Integrate Google Gemini API

Ensure that the utility function `translateText` correctly interacts with the Google Gemini API as defined in the utility section. The API has been integrated within the utility function, which is invoked by the API route.

---

## 3. Frontend Development

After completing and testing the backend and API logic, proceed to develop the frontend components.

### 3.1. Building Reusable Components

Organize frontend components within the `src/components/ui/` directory.

```bash
mkdir -p src/components/ui
```

#### 3.1.1. Fullscreen Text Input

Create a fullscreen text input component where users can enter text.

**File:** `src/components/ui/FullscreenTextInput.tsx`

```typescript
// src/components/ui/FullscreenTextInput.tsx
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
```

**Explanation:**
- **Props:** Accepts an `onSubmit` function to handle the submitted text.
- **Validation:** Ensures text is not empty and does not exceed 140 characters.
- **Styling:** Uses TailwindCSS for responsive and accessible design.

#### 3.1.2. Language Selection Modal

Create a modal for users to select three target languages from the 20 most common world languages.

**File:** `src/components/ui/LanguageSelectionModal.tsx`

```typescript
// src/components/ui/LanguageSelectionModal.tsx
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
```

**Explanation:**
- **Props:**
  - `isOpen`: Controls the visibility of the modal.
  - `onClose`: Function to close the modal.
  - `onSelectLanguages`: Function to handle the selected languages.
- **Language List:** Contains the 20 most common world languages.
- **Selection Logic:** Users can select up to three languages. Once three are selected, other checkboxes are disabled.
- **Styling:** Ensures the modal is centered with a semi-transparent backdrop.

#### 3.1.3. Translation Display

Create a component to display the translation results along with a "Start Over" button.

**File:** `src/components/ui/TranslationDisplay.tsx`

```typescript
// src/components/ui/TranslationDisplay.tsx
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
```

**Explanation:**
- **Props:**
  - `translations`: The translated texts as a JSON object.
  - `onStartOver`: Function to reset the application state.
- **Display:** Iterates over the `translations` object and displays each language code with its corresponding translated text.
- **Styling:** Uses TailwindCSS for a clean and readable layout.

---

## 4. Integrating Frontend with Backend

Now, integrate all frontend components with the backend API to create a seamless user experience.

**File:** `src/app/page.tsx`

```typescript
// src/app/page.tsx
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
```

**Explanation:**
- **State Management:**
  - `inputText`: Stores the user-entered text.
  - `isModalOpen`: Controls the visibility of the language selection modal.
  - `selectedLanguages`: Stores the selected language codes.
  - `translations`: Stores the translation results.
  - `isLoading`: Indicates if a translation request is in progress.
  - `error`: Stores any error messages.
- **Workflow:**
  1. **Text Submission:** User inputs text and submits via `FullscreenTextInput`, triggering `handleTextSubmit`.
  2. **Language Selection:** Modal opens for language selection. Upon selection, `handleLanguagesSubmit` is called.
  3. **API Request:** Sends a POST request to `/api/translate` with the input text and selected languages.
  4. **Displaying Results:** On successful translation, displays `TranslationDisplay`. If there's an error, shows an error message.
  5. **Start Over:** Resets the state to allow a new translation.

- **Error Handling:** Displays error messages in a visually distinct manner.

- **Styling:** Ensures a clean and user-friendly interface using TailwindCSS.

---

## 5. Testing and Validation

Ensure that all components and API routes function correctly.

### 5.1. Test API Routes

Use tools like Postman or curl to test the `/api/translate` endpoint.

**Example curl Command:**

```bash
curl -X POST http://localhost:3000/api/translate \
-H "Content-Type: application/json" \
-d '{
  "text": "Hello World",
  "targetLanguages": ["es", "fr", "de"]
}'
```

**Expected Response:**

```json
{
  "translations": {
    "es": "Hola Mundo",
    "fr": "Bonjour le monde",
    "de": "Hallo Welt"
  }
}
```

### 5.2. Test Frontend Functionality

1. **Input Validation:**
   - Try submitting empty text or text longer than 140 characters.
   - Ensure appropriate error messages are displayed.

2. **Language Selection:**
   - Attempt selecting more or less than three languages.
   - Verify that only three selections are allowed.

3. **Translation Display:**
   - Confirm that translations are correctly displayed.
   - Test the "Start Over" button to reset the state.

4. **Error Handling:**
   - Simulate API failures and ensure error messages appear.

5. **Responsiveness:**
   - Test the application on different screen sizes to ensure responsiveness.

---

## 6. Finalizing the Application

### 6.1. Code Optimization

- **Shorthand Imports:** Ensure all imports use shorthand paths as defined (`@/components`, `@/utils`, `@/types`).

**Example:**

```typescript
import FullscreenTextInput from "@/components/ui/FullscreenTextInput";
import { translateText } from "@/utils/gemini";
```

- **TypeScript Checks:** Run TypeScript to identify and fix any type errors.

```bash
npx tsc --noEmit
```

### 6.2. Clean Up

- **Remove Unused Code:** Ensure there's no dead or unused code in the project.
- **Comments and Documentation:** Add comments where necessary to explain complex logic.

### 6.3. Deployment Preparation

- **Build the Project:**

```bash
npm run build
```

- **Run in Production Mode:**

```bash
npm start
```

- **Environment Variables:** Ensure that environment variables (like `GEMINI_API_KEY`) are correctly set in the production environment.

---

## **Conclusion**

By following this guide, you have successfully developed a multiple-translation application using Next.js 15, TypeScript, and TailwindCSS. The application allows users to input text, select three target languages, and view translations seamlessly. The backend efficiently interacts with the Google Gemini API, ensuring accurate and formatted translations. Proper testing and adherence to development guidelines have ensured a robust and user-friendly application.