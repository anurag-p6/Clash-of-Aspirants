import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

/**
 * Generate quiz questions based on a topic using OpenAI
 * @param topic The topic to generate questions about
 * @param numQuestions Number of questions to generate
 */
export async function generateQuizQuestions(topic: string, numQuestions: number = 5): Promise<QuizQuestion[]> {
  try {
    const prompt = `
      Generate ${numQuestions} multiple-choice quiz questions about "${topic}". 
      For each question, provide 4 options with one correct answer.
      Format the response as a valid JSON array where each object has the following structure:
      {
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": index of correct option (0-3),
        "explanation": "Brief explanation of why the answer is correct"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that generates educational quiz questions."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Parse the response to get the generated questions
    const parsedResponse = JSON.parse(response.choices[0].message.content || '{"questions":[]}');
    return parsedResponse.questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
} 