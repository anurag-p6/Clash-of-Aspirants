export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

function trimEnv(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getCloudflareConfig() {
  return {
    apiKey: trimEnv(
      process.env.CLOUDFLARE_API_TOKEN ||
        process.env.CLOUDFLARE_API_KEY ||
        process.env.NEXT_PUBLIC_CLOUDFLARE_API_KEY
    ),
    accountId: trimEnv(
      process.env.CLOUDFLARE_ACCOUNT_ID || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID
    ),
  };
}

function formatCloudflareError(status: number, body: string): string {
  if (status === 401) {
    return (
      "Cloudflare authentication failed for Workers AI. Your API token is valid for the account " +
      "but does not include Workers AI permissions. In the Cloudflare dashboard go to Workers AI → " +
      "Use REST API → Create a Workers AI API Token (needs Workers AI Read and Edit). " +
      "Update CLOUDFLARE_API_TOKEN in .env and restart the dev server."
    );
  }
  return `Cloudflare AI API error: ${status} ${body}`;
}

/** Extract assistant text from Workers AI REST responses (legacy + chat completions). */
function extractTextFromCloudflareResponse(data: unknown): string {
  const payload = data as {
    result?: {
      response?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };
    choices?: Array<{ message?: { content?: string } }>;
  };

  const result = payload?.result;
  if (typeof result?.response === "string" && result.response.length > 0) {
    return result.response;
  }

  const choiceContent = result?.choices?.[0]?.message?.content ?? payload?.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string") {
    return choiceContent;
  }

  return "";
}

/** Pull a JSON array of questions out of model text (markdown fences, wrappers, etc.). */
function parseQuestionsJson(text: string): QuizQuestion[] {
  let cleaned = text.trim();
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```json\s?/gi, "").replace(/```\s?/g, "").trim();
  }

  const tryParse = (raw: string): QuizQuestion[] | null => {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    return null;
  };

  try {
    const direct = tryParse(cleaned);
    if (direct) return direct;
  } catch {
    // fall through to bracket extraction
  }

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    const extracted = tryParse(slice);
    if (extracted) return extracted;
  }

  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    const extracted = tryParse(cleaned.slice(objStart, objEnd + 1));
    if (extracted) return extracted;
  }

  throw new Error("Response is not a valid JSON array of questions");
}

function normalizeQuestions(questions: QuizQuestion[], topic: string): QuizQuestion[] {
  return questions.map((q, index) => {
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.correctOptionIndex !== "number" ||
      !q.explanation
    ) {
      return {
        question: q.question || `Question ${index + 1} about ${topic}`,
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options
            : ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : 0,
        explanation: q.explanation || "This is the correct answer.",
      };
    }
    return q;
  });
}

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
 * Generate quiz questions using Cloudflare Workers AI (Kimi)
 */
export async function generateQuizQuestions(topic: string, numQuestions: number = 5, difficulty: string): Promise<QuizQuestion[]> {
  const { apiKey, accountId } = getCloudflareConfig();

  if (!apiKey || !accountId) {
    console.log("⚠️ No valid Cloudflare API key or account ID found. Using mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }

  const prompt = `Generate exactly ${numQuestions} multiple-choice quiz questions on the topic "${topic}" with difficulty "${difficulty}". Questions must be clear, unique, and match the difficulty.
Return ONLY a JSON object with this shape (no markdown, no code fences):
{"questions":[{"question":"...","options":["A","B","C","D"],"correctOptionIndex":0,"explanation":"..."}]}`;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/moonshotai/kimi-k2.6`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a quiz generator. Output only valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      }),
    }
  );

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(formatCloudflareError(response.status, responseBody));
  }

  const data = JSON.parse(responseBody);

  if (data.success === false) {
    const errors = data.errors?.map((e: { message?: string }) => e.message).join("; ") ?? "Unknown error";
    if (data.errors?.some((e: { code?: number }) => e.code === 10000)) {
      throw new Error(formatCloudflareError(401, responseBody));
    }
    throw new Error(`Cloudflare AI API error: ${errors}`);
  }

  const text = extractTextFromCloudflareResponse(data);
  if (!text) {
    console.error("Unexpected Cloudflare response shape:", JSON.stringify(data).slice(0, 500));
    throw new Error("Cloudflare AI returned no text content");
  }

  const parsed = parseQuestionsJson(text);
  return normalizeQuestions(parsed, topic);
}
