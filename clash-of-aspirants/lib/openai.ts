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
 * Generate mock questions for development without an OpenAI API key
 */
function generateMockQuestions(topic: string, numQuestions: number): QuizQuestion[] {
  const mockTopics = {
    'history': [
      {
        question: `Which event marked the beginning of World War I?`,
        options: ["The Treaty of Versailles", "The assassination of Archduke Franz Ferdinand", "The invasion of Poland", "The bombing of Pearl Harbor"],
        correctOptionIndex: 1,
        explanation: "World War I began after the assassination of Archduke Franz Ferdinand of Austria in June 1914."
      },
      {
        question: `Who was the first President of the United States?`,
        options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
        correctOptionIndex: 2,
        explanation: "George Washington was the first President of the United States, serving from 1789 to 1797."
      }
    ],
    'science': [
      {
        question: `What is the chemical symbol for gold?`,
        options: ["Go", "Gd", "Gl", "Au"],
        correctOptionIndex: 3, 
        explanation: "The chemical symbol for gold is Au, derived from the Latin word 'aurum'."
      },
      {
        question: `Which planet is known as the Red Planet?`,
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctOptionIndex: 1,
        explanation: "Mars is known as the Red Planet due to the iron oxide prevalent on its surface."
      }
    ],
    'general': [
      {
        question: `What is the capital of Japan?`,
        options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
        correctOptionIndex: 2,
        explanation: "Tokyo is the capital and largest city of Japan."
      },
      {
        question: `Which is the longest river in the world?`,
        options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
        correctOptionIndex: 1,
        explanation: "The Nile River is the longest river in the world, stretching about 6,650 kilometers."
      }
    ]
  };

  // Choose mock topic or default to general
  let mockQuestionsSet = mockTopics['general'];
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes('history')) {
    mockQuestionsSet = mockTopics['history'];
  } else if (lowerTopic.includes('science') || lowerTopic.includes('physics') || lowerTopic.includes('chemistry') || lowerTopic.includes('biology')) {
    mockQuestionsSet = mockTopics['science'];
  }
  
  // Create an array of questions based on requested number
  let questions: QuizQuestion[] = [];
  for (let i = 0; i < numQuestions; i++) {
    // Repeat questions if we need more than we have
    const mockQuestion = mockQuestionsSet[i % mockQuestionsSet.length];
    const questionCopy = { ...mockQuestion };
    
    // Slightly modify the question if we need to repeat
    if (i >= mockQuestionsSet.length) {
      questionCopy.question = `${i + 1}. ${questionCopy.question}`;
    }
    
    questions.push(questionCopy);
  }
  
  return questions;
}

/**
 * Generate quiz questions based on a topic using OpenAI
 * @param topic The topic to generate questions about
 * @param numQuestions Number of questions to generate
 */
export async function generateQuizQuestions(topic: string, numQuestions: number = 5): Promise<QuizQuestion[]> {
  // Check if we have a valid API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
    console.log('No valid OpenAI API key found. Using mock questions for development.');
    return generateMockQuestions(topic, numQuestions);
  }
  
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
    // Return mock questions as fallback
    console.log('Falling back to mock questions due to OpenAI API error');
    return generateMockQuestions(topic, numQuestions);
  }
} 