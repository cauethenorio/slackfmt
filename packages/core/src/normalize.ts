import type { Code, Heading, Paragraph, PhrasingContent, Root, Strong, Table } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Plugin } from "unified";
import { unified } from "unified";

/**
 * Remark plugin that transforms heading nodes into bold paragraphs.
 * Slack doesn't support headings — this converts them to **bold** text.
 */
const remarkHeadingsToBold: Plugin<[], Root> = () => (tree) => {
  tree.children = tree.children.map((node) => {
    if (node.type !== "heading") return node;
    const heading = node as Heading;
    const strong: Strong = {
      type: "strong",
      children: heading.children,
    };
    const paragraph: Paragraph = {
      type: "paragraph",
      children: [strong],
    };
    return paragraph;
  });
};

function extractText(children: PhrasingContent[]): string {
  return children
    .map((child) => {
      if (child.type === "text") return child.value;
      if ("children" in child) return extractText(child.children as PhrasingContent[]);
      if (child.type === "inlineCode") return child.value;
      return "";
    })
    .join("");
}

/**
 * Remark plugin that transforms table nodes into code blocks.
 * Slack doesn't support tables — this renders them as aligned plain text.
 */
const remarkTablesToCodeBlocks: Plugin<[], Root> = () => (tree) => {
  tree.children = tree.children.map((node) => {
    if (node.type !== "table") return node;
    const table = node as Table;

    const rows = table.children.map((row) =>
      row.children.map((cell) => extractText(cell.children)),
    );

    const colWidths = rows[0].map((_, colIdx) =>
      Math.max(...rows.map((row) => (row[colIdx] || "").length)),
    );

    const lines = rows.map((row) =>
      row.map((cell, colIdx) => cell.padEnd(colWidths[colIdx])).join("   "),
    );

    const separator = colWidths.map((w) => "─".repeat(w)).join("   ");
    const [header, ...body] = lines;
    const value = [header, separator, ...body].join("\n");

    const code: Code = { type: "code", value };
    return code;
  });
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkHeadingsToBold)
  .use(remarkTablesToCodeBlocks)
  .use(remarkStringify, {
    bullet: "-",
    strong: "*",
    emphasis: "_",
    fences: true,
  });

/**
 * Normalize markdown for Slack compatibility.
 * Transforms syntax that Slack doesn't support into equivalent constructs.
 */
export function normalizeMarkdown(markdown: string): string {
  return processor.processSync(markdown).toString().trimEnd();
}
