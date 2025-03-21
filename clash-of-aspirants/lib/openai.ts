import { GoogleGenerativeAI } from "@google/generative-ai";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

// ✅ Initialize Gemini AI with API Key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "");
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
 * Generate quiz questions using Gemini API
 */
export async function generateQuizQuestions(topic: string, numQuestions: number = 5): Promise<QuizQuestion[]> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log("⚠️ No valid Gemini API key found. Using mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }

  try {
    const prompt = `
      Generate ${numQuestions} multiple-choice quiz questions on "${topic}".
      
      Important: Return ONLY the raw JSON array without code blocks, markdown, or any other formatting.
      
      Format response as:
      [{
        "question": "Text of the question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": index of correct option (0-3),
        "explanation": "Brief reason why this answer is correct"
      }]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    // Clean up the response to handle markdown code blocks
    let cleanedResponse = response;
    // Remove markdown code blocks if present
    if (response.includes("```")) {
      cleanedResponse = response.replace(/```json\s?/g, "").replace(/```\s?/g, "");
    }
    
    // Remove any leading/trailing whitespace
    cleanedResponse = cleanedResponse.trim();
    
    // Ensure the response starts with [ and ends with ]
    if (!cleanedResponse.startsWith("[") || !cleanedResponse.endsWith("]")) {
      throw new Error("Response is not a valid JSON array");
    }
    
    console.log("Cleaned response:", cleanedResponse);
    
    try {
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedResponse)) {
        // Validate the structure of each question
        const validatedQuestions = parsedResponse.map((q, index) => {
          if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || 
              typeof q.correctOptionIndex !== 'number' || !q.explanation) {
            // Fix malformed questions with minimal data
            return {
              question: q.question || `Question ${index + 1} about ${topic}`,
              options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
              correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
              explanation: q.explanation || "This is the correct answer."
            };
          }
          return q;
        });
        
        return validatedQuestions;
      }
      throw new Error("Invalid JSON format received from Gemini API");
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      throw new Error("Failed to parse Gemini API response as JSON");
    }
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    console.log("⚠️ Falling back to mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }
}
