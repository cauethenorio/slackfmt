interface DeltaOp {
  insert: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

interface QuillDelta {
  ops: DeltaOp[];
}

interface Line {
  segments: Segment[];
  attributes: Record<string, unknown>;
}

interface Segment {
  text: string;
  attributes: Record<string, unknown>;
}

export function quillDeltaToMarkdown(input: string): string {
  const delta: QuillDelta = JSON.parse(input);
  const lines = collectLines(delta.ops);
  return buildMarkdown(lines);
}

function collectLines(ops: DeltaOp[]): Line[] {
  const lines: Line[] = [];
  let current: Segment[] = [];

  for (const op of ops) {
    if (typeof op.insert !== "string") {
      const text = extractEmbedText(op.insert as Record<string, unknown>);
      if (text) {
        current.push({ text, attributes: op.attributes ?? {} });
      }
      continue;
    }

    const parts = op.insert.split("\n");

    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        current.push({ text: parts[i], attributes: op.attributes ?? {} });
      }

      if (i < parts.length - 1) {
        const blockAttrs = op.attributes ?? {};
        lines.push({ segments: current, attributes: blockAttrs });
        current = [];
      }
    }
  }

  if (current.length > 0) {
    lines.push({ segments: current, attributes: {} });
  }

  return lines;
}

function extractEmbedText(insert: Record<string, unknown>): string | null {
  const emoji = insert.slackemoji as { text?: string } | undefined;
  if (emoji?.text) return emoji.text;
  return null;
}

function buildMarkdown(lines: Line[]): string {
  const parts: string[] = [];
  let i = 0;
  const orderedCounters = new Map<number, number>();

  while (i < lines.length) {
    const line = lines[i];
    const blockType = getBlockType(line.attributes);

    if (isQuoted(line.attributes)) {
      orderedCounters.clear();
      const quoteLines: string[] = [];
      while (i < lines.length && isQuoted(lines[i].attributes)) {
        const { segments, attributes } = lines[i];
        if (attributes.list) {
          quoteLines.push(
            `> ${listMarker(attributes, orderedCounters)}${inlineMarkdown(segments)}`,
          );
        } else {
          // A quoted line right after a quoted list would read as part of its last item.
          if (i > 0 && lines[i - 1].attributes.border) quoteLines.push(">");
          orderedCounters.clear();
          quoteLines.push(`> ${inlineMarkdown(segments)}`);
        }
        i++;
      }
      orderedCounters.clear();
      parts.push(quoteLines.join("\n"));
    } else if (blockType === "bullet" || blockType === "ordered") {
      parts.push(listMarker(line.attributes, orderedCounters) + inlineMarkdown(line.segments));
      i++;
    } else if (blockType === "code-block") {
      orderedCounters.clear();
      const codeLines: string[] = [];
      while (i < lines.length && getBlockType(lines[i].attributes) === "code-block") {
        codeLines.push(rawText(lines[i].segments));
        i++;
      }
      parts.push(`\`\`\`\n${codeLines.join("\n")}\n\`\`\``);
    } else if (blockType === "header") {
      orderedCounters.clear();
      const level = Math.min(Math.max((line.attributes.header as number) || 1, 1), 6);
      parts.push(`${"#".repeat(level)} ${inlineMarkdown(line.segments)}`);
      i++;
    } else {
      orderedCounters.clear();
      parts.push(inlineMarkdown(line.segments));
      i++;
    }
  }

  return parts.join("\n");
}

function getBlockType(
  attrs: Record<string, unknown>,
): "bullet" | "ordered" | "code-block" | "header" | null {
  if (attrs.list === "bullet") return "bullet";
  if (attrs.list === "ordered") return "ordered";
  if (attrs["code-block"]) return "code-block";
  if (attrs.header) return "header";
  return null;
}

/** Slack marks a quoted list line with a border, and any other quoted line with blockquote. */
function isQuoted(attrs: Record<string, unknown>): boolean {
  if (attrs.list === "bullet" || attrs.list === "ordered") return !!attrs.border;
  return !!attrs.blockquote && !attrs["code-block"];
}

function listMarker(attrs: Record<string, unknown>, orderedCounters: Map<number, number>): string {
  const indentLevel = (attrs.indent as number) || 0;
  const indent = " ".repeat(indentLevel * 4);
  if (attrs.list === "bullet") {
    // Reset ordered counter at this indent level (switching list type resets numbering)
    orderedCounters.delete(indentLevel);
    return `${indent}- `;
  }
  const counter = (orderedCounters.get(indentLevel) || 0) + 1;
  orderedCounters.set(indentLevel, counter);
  // Reset counters for deeper levels
  for (const key of orderedCounters.keys()) {
    if (key > indentLevel) orderedCounters.delete(key);
  }
  return `${indent}${counter}. `;
}

/**
 * Get the outer wrapping markers for a segment's attributes.
 * "Outer" means markers that can span multiple segments (bold, italic, strike).
 * "Inner" means per-segment markers (code, link) that differ between segments.
 */
function outerMarkerKey(attrs: Record<string, unknown>): string {
  const parts: string[] = [];
  if (attrs.bold) parts.push("bold");
  if (attrs.italic) parts.push("italic");
  if (attrs.strike) parts.push("strike");
  return parts.join(",");
}

function inlineMarkdown(segments: Segment[]): string {
  const result: string[] = [];
  let i = 0;

  while (i < segments.length) {
    const key = outerMarkerKey(segments[i].attributes);

    // Find run of segments sharing the same outer markers
    let j = i + 1;
    while (j < segments.length && outerMarkerKey(segments[j].attributes) === key) {
      j++;
    }

    // Format inner content for each segment in the run
    let inner = "";
    for (let k = i; k < j; k++) {
      inner += formatSegmentInner(segments[k].text, segments[k].attributes);
    }

    // Wrap with shared outer markers
    inner = wrapOuter(inner, segments[i].attributes);
    result.push(inner);
    i = j;
  }

  return result.join("");
}

function rawText(segments: Segment[]): string {
  return segments.map((s) => s.text).join("");
}

function formatSegmentInner(text: string, attrs: Record<string, unknown>): string {
  let result = text;
  if (attrs.code) {
    result = `\`${result}\``;
  }
  if (attrs.link) {
    result = `[${result}](${attrs.link})`;
  }
  return result;
}

function wrapOuter(text: string, attrs: Record<string, unknown>): string {
  if (!attrs.bold && !attrs.italic && !attrs.strike) return text;

  // Trailing spaces must be moved outside markers (e.g. "**bold **" is invalid)
  const trimmed = text.replace(/\s+$/, "");
  const trailing = text.slice(trimmed.length);

  let result = trimmed;
  if (attrs.bold) {
    result = `**${result}**`;
  }
  if (attrs.italic) {
    result = `*${result}*`;
  }
  if (attrs.strike) {
    result = `~~${result}~~`;
  }
  return result + trailing;
}
