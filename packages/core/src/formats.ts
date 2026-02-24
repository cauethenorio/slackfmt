import { htmlToMarkdown } from "./parsers/html.js";
import { quillDeltaToMarkdown } from "./parsers/quill-delta.js";
import { slackHtmlToMarkdown } from "./parsers/slack-html.js";

export type InputFormat = "markdown" | "html" | "slack-html" | "quill-delta";

export interface FormatDescriptor {
  id: InputFormat;
  mimeTypes: string[];
  toMarkdown: (input: string) => string;
}

/**
 * Supported formats, ordered by MIME type priority (highest first).
 * text/plain is last since every paste includes it as fallback.
 */
export const formats: FormatDescriptor[] = [
  { id: "quill-delta", mimeTypes: ["slack/texty"], toMarkdown: quillDeltaToMarkdown },
  { id: "slack-html", mimeTypes: ["slack/html"], toMarkdown: slackHtmlToMarkdown },
  { id: "html", mimeTypes: ["text/html"], toMarkdown: htmlToMarkdown },
  { id: "markdown", mimeTypes: ["text/plain"], toMarkdown: (input) => input },
];
