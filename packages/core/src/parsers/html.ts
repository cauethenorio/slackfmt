import type { Element, Root, RootContent, Text } from "hast";
import rehypeParse from "rehype-parse";
import TurndownService from "turndown";
import { unified } from "unified";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  preformattedCode: true,
});

turndown.addRule("brInPre", {
  filter(node) {
    return node.nodeName === "BR" && !!node.closest("pre");
  },
  replacement() {
    return "\n";
  },
});

const PRESENTATIONAL_TAGS = new Set(["span", "div", "br"]);

function isPresentationalOnly(node: RootContent): boolean {
  if (node.type === "text") return true;
  if (node.type === "comment" || node.type === "doctype") return true;
  if (node.type === "element") {
    if (!PRESENTATIONAL_TAGS.has(node.tagName)) return false;
    return node.children.every(isPresentationalOnly);
  }
  return false;
}

function hasWhiteSpacePre(el: Element): boolean {
  const style = (el.properties?.style as string) ?? "";
  return /white-space\s*:\s*pre/.test(style);
}

function findPreformattedContainer(nodes: RootContent[]): Element | null {
  for (const node of nodes) {
    if (node.type !== "element") continue;
    if (node.tagName === "pre") return node;
    if (node.tagName === "div" && hasWhiteSpacePre(node)) return node;
    // Walk into wrapper elements like html, head, body, div
    const found = findPreformattedContainer(node.children as RootContent[]);
    if (found) return found;
  }
  return null;
}

function extractText(nodes: RootContent[]): string {
  let result = "";
  for (const node of nodes) {
    if (node.type === "text") {
      result += (node as Text).value;
    } else if (node.type === "element") {
      if (node.tagName === "br") {
        result += "\n";
      } else if (node.tagName === "div") {
        // div boundaries produce newlines, but avoid leading newline for first div
        if (result.length > 0 && !result.endsWith("\n")) {
          result += "\n";
        }
        const inner = extractText(node.children as RootContent[]);
        if (inner === "") {
          // Empty div = blank line
          result += "\n";
        } else {
          result += inner;
        }
      } else {
        // span or other presentational — just recurse
        result += extractText(node.children as RootContent[]);
      }
    }
  }
  return result;
}

function tryExtractSyntaxHighlighted(input: string): string | null {
  const tree = unified().use(rehypeParse, { fragment: false }).parse(input) as Root;

  const container = findPreformattedContainer(tree.children as RootContent[]);
  if (!container) return null;

  // Check all children are presentational only
  if (!container.children.every((c) => isPresentationalOnly(c as RootContent))) return null;

  const text = extractText(container.children as RootContent[]);
  // Trim trailing newline that may result from structure
  return text.replace(/\n$/, "");
}

export function htmlToMarkdown(input: string): string {
  const extracted = tryExtractSyntaxHighlighted(input);
  if (extracted !== null) return extracted;
  return turndown.turndown(input);
}
