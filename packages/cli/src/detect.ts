import type { InputFormat } from "@slackfmt/core";

export function detectFormat(input: string): InputFormat {
  const trimmed = input.trim();

  // Quill Delta: JSON with "ops" array
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || (parsed && Array.isArray(parsed.ops))) {
        return "quill-delta";
      }
    } catch {
      // Not valid JSON, fall through
    }
  }

  // HTML: starts with a tag
  if (/<[a-z][a-z0-9]*[\s>]/i.test(trimmed.slice(0, 200))) {
    return "html";
  }

  return "markdown";
}
