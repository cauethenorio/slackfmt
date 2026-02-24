import type { Heading, Paragraph, Root, Strong } from "mdast";
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

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkHeadingsToBold)
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
