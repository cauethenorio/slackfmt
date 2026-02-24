import { formats } from "./formats.js";
import { normalizeMarkdown } from "./normalize.js";
import { markdownToDelta } from "./serializers/markdown-to-delta.js";

export type { FormatDescriptor, InputFormat } from "./formats.js";
export { formats } from "./formats.js";

export interface ConvertOptions {
  format: string;
}

export async function convert(input: string, options: ConvertOptions): Promise<string> {
  const fmt = formats.find((f) => f.id === options.format);
  if (!fmt) {
    throw new Error(`Unknown format: ${options.format}`);
  }

  const markdown = normalizeMarkdown(fmt.toMarkdown(input));
  return markdownToDelta(markdown);
}
