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
  let orderedCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const blockType = getBlockType(line.attributes);

    if (blockType === "bullet") {
      const indent = ((line.attributes.indent as number) || 0) * 2;
      const prefix = `${" ".repeat(indent)}- `;
      parts.push(prefix + inlineMarkdown(line.segments));
      i++;
    } else if (blockType === "ordered") {
      orderedCounter++;
      const indent = ((line.attributes.indent as number) || 0) * 3;
      const prefix = `${" ".repeat(indent)}${orderedCounter}. `;
      parts.push(prefix + inlineMarkdown(line.segments));
      i++;
    } else if (blockType === "code-block") {
      orderedCounter = 0;
      const codeLines: string[] = [];
      while (i < lines.length && getBlockType(lines[i].attributes) === "code-block") {
        codeLines.push(rawText(lines[i].segments));
        i++;
      }
      parts.push(`\`\`\`\n${codeLines.join("\n")}\n\`\`\``);
    } else if (blockType === "blockquote") {
      orderedCounter = 0;
      const quoteLines: string[] = [];
      while (i < lines.length && getBlockType(lines[i].attributes) === "blockquote") {
        quoteLines.push(`> ${inlineMarkdown(lines[i].segments)}`);
        i++;
      }
      parts.push(quoteLines.join("\n"));
    } else if (blockType === "header") {
      orderedCounter = 0;
      const level = Math.min(Math.max((line.attributes.header as number) || 1, 1), 6);
      parts.push(`${"#".repeat(level)} ${inlineMarkdown(line.segments)}`);
      i++;
    } else {
      orderedCounter = 0;
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
