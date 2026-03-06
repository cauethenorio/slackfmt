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
    if (typeof op.insert !== "string") continue;

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

function buildMarkdown(lines: Line[]): string {
  const parts: string[] = [];
  let i = 0;
  const orderedCounters = new Map<number, number>();

  while (i < lines.length) {
    const line = lines[i];
    const blockType = getBlockType(line.attributes);

    if (blockType === "bullet") {
      const indentLevel = (line.attributes.indent as number) || 0;
      // Reset ordered counter at this indent level (switching list type resets numbering)
      orderedCounters.delete(indentLevel);
      const indent = indentLevel * 4;
      const prefix = `${" ".repeat(indent)}- `;
      parts.push(prefix + inlineMarkdown(line.segments));
      i++;
    } else if (blockType === "ordered") {
      const indentLevel = (line.attributes.indent as number) || 0;
      const counter = (orderedCounters.get(indentLevel) || 0) + 1;
      orderedCounters.set(indentLevel, counter);
      // Reset counters for deeper levels
      for (const key of orderedCounters.keys()) {
        if (key > indentLevel) orderedCounters.delete(key);
      }
      const indent = indentLevel * 4;
      const prefix = `${" ".repeat(indent)}${counter}. `;
      parts.push(prefix + inlineMarkdown(line.segments));
      i++;
    } else if (blockType === "code-block") {
      orderedCounters.clear();
      const codeLines: string[] = [];
      while (i < lines.length && getBlockType(lines[i].attributes) === "code-block") {
        codeLines.push(rawText(lines[i].segments));
        i++;
      }
      parts.push(`\`\`\`\n${codeLines.join("\n")}\n\`\`\``);
    } else if (blockType === "blockquote") {
      orderedCounters.clear();
      const quoteLines: string[] = [];
      while (i < lines.length && getBlockType(lines[i].attributes) === "blockquote") {
        quoteLines.push(`> ${inlineMarkdown(lines[i].segments)}`);
        i++;
      }
      parts.push(quoteLines.join("\n"));
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
): "bullet" | "ordered" | "code-block" | "blockquote" | "header" | null {
  if (attrs.list === "bullet") return "bullet";
  if (attrs.list === "ordered") return "ordered";
  if (attrs["code-block"]) return "code-block";
  if (attrs.blockquote) return "blockquote";
  if (attrs.header) return "header";
  return null;
}

function inlineMarkdown(segments: Segment[]): string {
  return segments.map((s) => formatSegment(s.text, s.attributes)).join("");
}

function rawText(segments: Segment[]): string {
  return segments.map((s) => s.text).join("");
}

function formatSegment(text: string, attrs: Record<string, unknown>): string {
  let result = text;

  if (attrs.code) {
    result = `\`${result}\``;
  }
  if (attrs.bold) {
    result = `**${result}**`;
  }
  if (attrs.italic) {
    result = `*${result}*`;
  }
  if (attrs.strike) {
    result = `~~${result}~~`;
  }
  if (attrs.link) {
    result = `[${result}](${attrs.link})`;
  }

  return result;
}
