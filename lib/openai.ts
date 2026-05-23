export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const BATCH_SIZE = 2;
const MAX_RETRIES = 2;

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
      "Cloudflare authentication failed for Workers AI. Create a Workers AI API token " +
      "(Workers AI Read + Edit) and set CLOUDFLARE_API_TOKEN in .env."
    );
  }
  return `Cloudflare AI API error: ${status} ${body.slice(0, 300)}`;
}

function extractTextFromCloudflareResponse(data: unknown): string {
  const payload = data as {
    result?: {
      response?: string;
      choices?: Array<{ message?: { content?: string | Record<string, unknown> } }>;
    };
    choices?: Array<{ message?: { content?: string | Record<string, unknown> } }>;
  };

  const result = payload?.result;
  if (typeof result?.response === "string" && result.response.length > 0) {
    return result.response;
  }

  const messageContent =
    result?.choices?.[0]?.message?.content ?? payload?.choices?.[0]?.message?.content;

  if (typeof messageContent === "string") return messageContent;
  if (messageContent && typeof messageContent === "object") {
    return JSON.stringify(messageContent);
  }

  return "";
}

/** Fix common LLM JSON mistakes before parsing. */
function repairJsonString(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\uFEFF/, "");
  s = s.replace(/```json\s?/gi, "").replace(/```\s?/g, "").trim();
  // Strip trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");
  // Replace smart quotes
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  return s;
}

function extractBalancedSegment(text: string, open: "{" | "["): string | null {
  const close = open === "{" ? "}" : "]";
  const start = text.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function coerceQuestion(value: unknown, topic: string, index: number): QuizQuestion | null {
  if (!value || typeof value !== "object") return null;
  const q = value as Record<string, unknown>;

  const question =
    typeof q.question === "string" ? q.question.trim() : "";
  let options = q.options;
  if (!Array.isArray(options)) return null;

  const optionStrings = options
    .map((o) => (typeof o === "string" ? o.trim() : String(o)))
    .filter(Boolean)
    .slice(0, 6);

  if (optionStrings.length < 2) return null;

  let correctOptionIndex =
    typeof q.correctOptionIndex === "number"
      ? q.correctOptionIndex
      : typeof q.correctOptionIndex === "string"
        ? parseInt(q.correctOptionIndex, 10)
        : 0;

  if (Number.isNaN(correctOptionIndex)) correctOptionIndex = 0;
  correctOptionIndex = Math.max(0, Math.min(optionStrings.length - 1, correctOptionIndex));

  const explanation =
    typeof q.explanation === "string" && q.explanation.trim()
      ? q.explanation.trim().slice(0, 200)
      : "This is the correct answer.";

  return {
    question: question || `Question ${index + 1} about ${topic}`,
    options: optionStrings,
    correctOptionIndex,
    explanation,
  };
}

function questionsFromParsed(parsed: unknown): QuizQuestion[] {
  if (Array.isArray(parsed)) {
    return parsed
      .map((item, i) => coerceQuestion(item, "quiz", i))
      .filter((q): q is QuizQuestion => q !== null);
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      return obj.questions
        .map((item, i) => coerceQuestion(item, "quiz", i))
        .filter((q): q is QuizQuestion => q !== null);
    }
  }
  return [];
}

/** Try multiple strategies to parse quiz JSON from model output. */
export function parseQuestionsJson(text: string, topic: string): QuizQuestion[] {
  const candidates = [
    text,
    repairJsonString(text),
    extractBalancedSegment(text, "{") ?? "",
    extractBalancedSegment(repairJsonString(text), "{") ?? "",
    extractBalancedSegment(text, "[") ?? "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const questions = questionsFromParsed(parsed);
      if (questions.length > 0) {
        return questions.map((q, i) =>
          coerceQuestion(q, topic, i) ?? {
            ...q,
            question: q.question || `Question ${i + 1} about ${topic}`,
          }
        );
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    "AI returned invalid quiz JSON. Try again with a shorter topic or fewer questions."
  );
}

function normalizeQuestions(questions: QuizQuestion[], topic: string): QuizQuestion[] {
  return questions.map((q, index) => coerceQuestion(q, topic, index)!);
}

function questionKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Drop duplicate questions (AI sometimes repeats within a batch). */
export function deduplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>();
  const unique: QuizQuestion[] = [];
  for (const q of questions) {
    const key = questionKey(q.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }
  return unique;
}

function generateMockQuestions(topic: string, numQuestions: number): QuizQuestion[] {
  const pools: Record<string, QuizQuestion[]> = {
    history: [
      {
        question: "Which event is widely considered the immediate trigger for World War I?",
        options: [
          "The Treaty of Versailles",
          "The assassination of Archduke Franz Ferdinand",
          "The invasion of Poland",
          "The bombing of Pearl Harbor",
        ],
        correctOptionIndex: 1,
        explanation: "The assassination in Sarajevo in 1914 escalated tensions into WWI.",
      },
      {
        question: "Who was the first President of the United States?",
        options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
        correctOptionIndex: 1,
        explanation: "George Washington served as the first U.S. president.",
      },
      {
        question: "The French Revolution began in which year?",
        options: ["1689", "1776", "1789", "1815"],
        correctOptionIndex: 2,
        explanation: "The French Revolution started in 1789.",
      },
      {
        question: "Which ancient civilization built the Machu Picchu complex?",
        options: ["Aztec", "Maya", "Inca", "Olmec"],
        correctOptionIndex: 2,
        explanation: "Machu Picchu was built by the Inca civilization.",
      },
      {
        question: "The Berlin Wall fell in which year?",
        options: ["1979", "1989", "1999", "2001"],
        correctOptionIndex: 1,
        explanation: "The Berlin Wall fell in 1989, symbolizing the end of the Cold War era.",
      },
    ],
    science: [
      {
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Gl", "Au"],
        correctOptionIndex: 3,
        explanation: "Gold's symbol is Au from the Latin aurum.",
      },
      {
        question: "What planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctOptionIndex: 1,
        explanation: "Mars appears red due to iron oxide on its surface.",
      },
      {
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
        correctOptionIndex: 2,
        explanation: "Mitochondria produce ATP for cellular energy.",
      },
      {
        question: "Water's chemical formula is:",
        options: ["CO2", "NaCl", "H2O", "O2"],
        correctOptionIndex: 2,
        explanation: "Water consists of two hydrogen atoms and one oxygen atom.",
      },
      {
        question: "What gas do plants absorb from the atmosphere for photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correctOptionIndex: 2,
        explanation: "Plants use carbon dioxide to produce glucose.",
      },
    ],
    general: [
      {
        question: "What is the capital of Japan?",
        options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
        correctOptionIndex: 2,
        explanation: "Tokyo is the capital of Japan.",
      },
      {
        question: "How many continents are there on Earth?",
        options: ["5", "6", "7", "8"],
        correctOptionIndex: 2,
        explanation: "Earth is commonly divided into seven continents.",
      },
      {
        question: "Which ocean is the largest?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correctOptionIndex: 3,
        explanation: "The Pacific Ocean is the largest ocean.",
      },
      {
        question: "What is the smallest prime number?",
        options: ["0", "1", "2", "3"],
        correctOptionIndex: 2,
        explanation: "2 is the smallest and only even prime number.",
      },
      {
        question: "Which language has the most native speakers worldwide?",
        options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
        correctOptionIndex: 2,
        explanation: "Mandarin Chinese has the largest number of native speakers.",
      },
    ],
  };

  let pool = pools.general;
  if (topic.toLowerCase().includes("history")) pool = pools.history;
  if (topic.toLowerCase().includes("science")) pool = pools.science;

  const result: QuizQuestion[] = [];
  for (let i = 0; i < numQuestions; i++) {
    result.push({ ...pool[i % pool.length] });
  }
  return deduplicateQuestions(result);
}

async function callCloudflareAI(
  apiKey: string,
  accountId: string,
  prompt: string
): Promise<string> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${AI_MODEL}`,
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
            content:
              "You output only valid JSON. Escape double quotes inside strings. No markdown.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      }),
    }
  );

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(formatCloudflareError(response.status, responseBody));
  }

  let data: unknown;
  try {
    data = JSON.parse(responseBody);
  } catch {
    throw new Error("Cloudflare returned a non-JSON HTTP response");
  }

  const envelope = data as {
    success?: boolean;
    errors?: Array<{ code?: number; message?: string }>;
  };

  if (envelope.success === false) {
    if (envelope.errors?.some((e) => e.code === 10000)) {
      throw new Error(formatCloudflareError(401, responseBody));
    }
    const errors =
      envelope.errors?.map((e) => e.message).filter(Boolean).join("; ") ?? "Unknown error";
    throw new Error(`Cloudflare AI API error: ${errors}`);
  }

  const text = extractTextFromCloudflareResponse(data);
  if (!text) {
    throw new Error("Cloudflare AI returned no text content");
  }

  return text;
}

async function generateQuestionBatch(
  apiKey: string,
  accountId: string,
  topic: string,
  count: number,
  difficulty: string,
  _startIndex: number,
  avoidQuestions: string[] = []
): Promise<QuizQuestion[]> {
  const avoidList =
    avoidQuestions.length > 0
      ? `\nDo NOT repeat or rephrase these existing questions:\n${avoidQuestions.map((q) => `- ${q}`).join("\n")}`
      : "";

  const prompt = `Generate exactly ${count} unique multiple-choice quiz questions about "${topic}" (${difficulty} difficulty).
Return ONLY valid JSON in this exact shape:
{"questions":[{"question":"text","options":["A","B","C","D"],"correctOptionIndex":0,"explanation":"short reason"}]}
Rules: exactly 4 options each; correctOptionIndex 0-3; each question must be completely different; keep explanations under 120 characters; escape quotes in strings.${avoidList}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const text = await callCloudflareAI(apiKey, accountId, prompt);
      const parsed = parseQuestionsJson(text, topic);
      return deduplicateQuestions(normalizeQuestions(parsed, topic));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Quiz batch attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  throw lastError ?? new Error("Failed to generate quiz questions");
}

/**
 * Generate quiz questions using Cloudflare Workers AI (batched for reliable JSON).
 */
export async function generateQuizQuestions(
  topic: string,
  numQuestions: number = 5,
  difficulty: string
): Promise<QuizQuestion[]> {
  const { apiKey, accountId } = getCloudflareConfig();

  if (!apiKey || !accountId) {
    console.log("No Cloudflare credentials — using mock questions.");
    return generateMockQuestions(topic, numQuestions);
  }

  const allQuestions: QuizQuestion[] = [];
  let attempts = 0;
  const maxAttempts = numQuestions * 3;

  while (allQuestions.length < numQuestions && attempts < maxAttempts) {
    attempts++;
    const need = numQuestions - allQuestions.length;
    const batchCount = Math.min(BATCH_SIZE, need);
    const batch = await generateQuestionBatch(
      apiKey,
      accountId,
      topic,
      batchCount,
      difficulty,
      allQuestions.length,
      allQuestions.map((q) => q.question)
    );
    allQuestions.push(...deduplicateQuestions(batch));
    allQuestions.splice(0, allQuestions.length, ...deduplicateQuestions(allQuestions));
  }

  if (allQuestions.length < numQuestions) {
    const mockFill = generateMockQuestions(topic, numQuestions - allQuestions.length);
    allQuestions.push(...deduplicateQuestions(mockFill));
    allQuestions.splice(0, allQuestions.length, ...deduplicateQuestions(allQuestions));
  }

  if (allQuestions.length < numQuestions) {
    throw new Error(
      `Only generated ${allQuestions.length} of ${numQuestions} questions. Please try again.`
    );
  }

  return allQuestions.slice(0, numQuestions);
}
