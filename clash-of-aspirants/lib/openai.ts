import { GoogleGenerativeAI } from "@google/generative-ai";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

// ✅ Initialize Gemini AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generate mock questions for development without an API key
 */
function generateMockQuestions(topic: string, numQuestions: number): QuizQuestion[] {
  const mockTopics = {
    history: [
      {
        question: `Which event marked the beginning of World War I?`,
        options: [
          "The Treaty of Versailles",
          "The assassination of Archduke Franz Ferdinand",
          "The invasion of Poland",
          "The bombing of Pearl Harbor",
        ],
        correctOptionIndex: 1,
        explanation: "World War I began after the assassination of Archduke Franz Ferdinand in June 1914.",
      },
    ],
    science: [
      {
        question: `What is the chemical symbol for gold?`,
        options: ["Go", "Gd", "Gl", "Au"],
        correctOptionIndex: 3,
        explanation: "The chemical symbol for gold is Au, derived from the Latin word 'aurum'.",
      },
    ],
    general: [
      {
        question: `What is the capital of Japan?`,
        options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
        correctOptionIndex: 2,
        explanation: "Tokyo is the capital and largest city of Japan.",
      },
    ],
  };

  let selectedTopic = mockTopics.general;
  if (topic.toLowerCase().includes("history")) selectedTopic = mockTopics.history;
  if (topic.toLowerCase().includes("science")) selectedTopic = mockTopics.science;

  return Array.from({ length: numQuestions }, (_, i) => ({
    ...selectedTopic[i % selectedTopic.length],
    question: `${i + 1}. ${selectedTopic[i % selectedTopic.length].question}`,
  }));
}

/**
 * Extract JSON from a string that might contain markdown code blocks
 */
function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code block syntax if present
  const jsonRegex = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/;
  const match = text.match(jsonRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code blocks found, just return the original text
  return text.trim();
}

/**
 * Generate quiz questions using Gemini API
 */
export async function generateQuizQuestions(topic: string, numQuestions: number = 5): Promise<QuizQuestion[]> {
  if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.log("⚠️ No valid Gemini API key found. Using mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }

  try {
    const prompt = `
    Generate ${numQuestions} multiple-choice quiz questions on "${topic}".
    Format response as a JSON array:
    [{
      "question": "Text of the question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": index of correct option (0-3),
      "explanation": "Brief reason why this answer is correct"
    }]
  
    If the question involves code, format the code snippet in a code block using triple backticks (\`\`\`).
    Example:
    {
      "question": "What does the following Python code output?",
      "options": ["5", "10", "Error", "None"],
      "correctOptionIndex": 1,
      "explanation": "The code adds 5 and 5, resulting in 10.",
      "codeSnippet": "\`\`\`python\nprint(5 + 5)\n\`\`\`"
    }
  
    IMPORTANT: Return ONLY the JSON array, nothing else. No markdown, no code blocks outside the JSON structure.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    console.log("Raw Gemini response:", response);
    
    // Clean the response by extracting JSON if needed
    const cleanedResponse = extractJsonFromMarkdown(response);
    console.log("Cleaned response:", cleanedResponse);
    
    try {
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedResponse)) {
        console.log("Successfully parsed questions from Gemini API");
        return parsedResponse;
      }
      throw new Error("Response is not an array");
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.log("Raw response:", response);
      console.log("Cleaned response:", cleanedResponse);
      throw new Error("Invalid JSON format received from Gemini API");
    }
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    console.log("⚠️ Falling back to mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }
}
