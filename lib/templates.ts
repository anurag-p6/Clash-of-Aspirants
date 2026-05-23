import { prisma } from "@/lib/prisma";
import { generateQuizQuestions, QuizQuestion } from "@/lib/openai";
import { normalizeOptions, stripQuestionNumberPrefix } from "@/lib/quiz-utils";

const MOCK_QUESTION_MARKERS = [
  "assassination of Archduke Franz Ferdinand",
  "chemical symbol for gold",
  "capital of Japan",
];

function isMockTemplate(questions: { content: string }[]): boolean {
  return questions.some((q) =>
    MOCK_QUESTION_MARKERS.some((marker) => q.content.includes(marker))
  );
}

/**
 * Create a new quiz template in the database
 */
export async function createQuizTemplate(topic: string, questions: QuizQuestion[], difficulty: string) {
  try {
    // Validate that we have valid questions before proceeding
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error(`No valid questions provided for topic: ${topic}`);
    }

    console.log(`Creating template for topic "${topic}" with ${questions.length} questions`);
    
    // Validate each question has the required properties
    questions.forEach((q, index) => {
      const idx =
        typeof q.correctOptionIndex === "number"
          ? q.correctOptionIndex
          : parseInt(String(q.correctOptionIndex), 10);
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        Number.isNaN(idx)
      ) {
        console.error(`Invalid question at index ${index}:`, q);
        throw new Error(`Question ${index + 1} has invalid format`);
      }
      q.correctOptionIndex = Math.max(0, Math.min(q.options.length - 1, idx));
    });
    
    const template = await prisma.quizTemplate.create({
      data: {
        topic,
        difficulty,
        questions: {
          create: questions.map(q => {
            // Ensure JSON is properly handled
            const options = normalizeOptions(q.options);
            
            return {
              content: stripQuestionNumberPrefix(q.question),
              options:
                options.length >= 2
                  ? options
                  : ["Option A", "Option B", "Option C", "Option D"],
              correctOption: q.correctOptionIndex,
              explanation: q.explanation || "This is the correct answer",
            };
          })
        }
      },
      include: {
        questions: true
      }
    });
    
    return template;
  } catch (error) {
    console.error("Error creating quiz template:", error as Error);
    throw error;
  }
}

/**
 * Fresh AI questions for a new room (never reuses cached templates).
 */
export async function generateQuestionsForRoom(
  topic: string,
  numQuestions: number = 5,
  difficulty: string
): Promise<QuizQuestion[]> {
  return generateQuizQuestions(topic, numQuestions, difficulty);
}

/**
 * Generate and store a new quiz template (used for seeding / admin; may reuse cache).
 */
export async function generateAndStoreQuizTemplate(topic: string, numQuestions: number = 5, difficulty: string) {
  try {
    // Reuse a cached template only when topic, difficulty, and question count match
    const existingTemplate = await prisma.quizTemplate.findFirst({
      where: {
        topic: { equals: topic, mode: "insensitive" },
        difficulty,
      },
      include: {
        questions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (
      existingTemplate &&
      existingTemplate.questions.length >= numQuestions &&
      !isMockTemplate(existingTemplate.questions)
    ) {
      return existingTemplate;
    }
    
    // Generate new questions using AI
    const questions = await generateQuizQuestions(topic, numQuestions, difficulty);
    
    // Create a new template
    const template = await createQuizTemplate(topic, questions, difficulty);
    
    return template;
  } catch (error) {
    console.error("Error generating quiz template:", error);
    throw error;
  }
}

/**
 * Get quiz template by ID
 */
export async function getQuizTemplate(templateId: string) {
  return prisma.quizTemplate.findUnique({
    where: { id: templateId },
    include: {
      questions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
}

/**
 * Find quiz template by topic
 */
export async function findQuizTemplateByTopic(topic: string) {
  return prisma.quizTemplate.findFirst({
    where: {
      topic: {
        equals: topic,
        mode: "insensitive"
      }
    },
    include: {
      questions: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  });
}

/**
 * List all quiz templates
 */
export async function listQuizTemplates() {
  return prisma.quizTemplate.findMany({
    include: {
      _count: {
        select: { questions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

// Template question type for use in other files
export interface TemplateQuestion {
  id: string;
  templateId: string;
  content: string;
  options: any;
  correctOption: number;
  explanation: string | null;
  createdAt: Date;
} 