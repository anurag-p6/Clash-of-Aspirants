/**
 * Normalize Prisma JSON / API payloads into a display-ready options array.
 */
export function normalizeOptions(options: unknown): string[] {
  if (options == null) return [];

  if (Array.isArray(options)) {
    return options.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];
    try {
      return normalizeOptions(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  if (typeof options === "object") {
    const record = options as Record<string, unknown>;
    const keys = Object.keys(record).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return keys
      .map((key) => record[key])
      .filter((value) => value != null && String(value).trim().length > 0)
      .map((value) => String(value).trim());
  }

  return [];
}

/** Remove leading "1. " style prefixes; UI shows question numbers separately. */
export function stripQuestionNumberPrefix(content: string): string {
  return content.replace(/^\s*\d+\.\s*/, "").trim();
}

export interface ClientQuestion {
  id: string;
  content: string;
  options: string[];
  createdAt?: string;
}

export function formatQuestionForClient(question: {
  id: string;
  content: string;
  options: unknown;
  createdAt?: Date | string;
}): ClientQuestion {
  const options = normalizeOptions(question.options);
  return {
    id: question.id,
    content: stripQuestionNumberPrefix(question.content),
    options:
      options.length >= 2
        ? options
        : ["Option A", "Option B", "Option C", "Option D"],
    createdAt:
      question.createdAt instanceof Date
        ? question.createdAt.toISOString()
        : question.createdAt,
  };
}
