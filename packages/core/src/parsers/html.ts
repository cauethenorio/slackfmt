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

turndown.addRule("plainPre", {
  filter(node) {
    return node.nodeName === "PRE" && !node.querySelector("code");
  },
  replacement(_content, node) {
    const text = rawText(node).replace(/^\n+|\n+$/g, "");
    const longest = Math.max(2, ...(text.match(/`+/g) ?? []).map((run) => run.length));
    const fence = "`".repeat(longest + 1);
    return `\n\n${fence}\n${text}\n${fence}\n\n`;
  },
});

/** A node's text as written, unescaped, with its line breaks. */
function rawText(node: Node): string {
  if (node.nodeName === "BR") return "\n";
  if (node.childNodes.length === 0) return node.textContent ?? "";
  return Array.from(node.childNodes).map(rawText).join("");
}

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

const HIDDEN_TAGS = new Set(["head", "style", "script", "title"]);

/** The text a reader sees, without its spacing. */
function visibleText(nodes: RootContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value.replace(/\s+/g, "");
      if (node.type !== "element" || HIDDEN_TAGS.has(node.tagName)) return "";
      return visibleText(node.children as RootContent[]);
    })
    .join("");
}

function tryExtractSyntaxHighlighted(input: string): string | null {
  const tree = unified().use(rehypeParse, { fragment: false }).parse(input) as Root;

  const container = findPreformattedContainer(tree.children as RootContent[]);
  if (!container) return null;

  // Check all children are presentational only
  if (!container.children.every((c) => isPresentationalOnly(c as RootContent))) return null;

  // Beside other text it's one block among others, and returning it alone would lose the rest.
  if (visibleText(tree.children as RootContent[]) !== visibleText([container])) return null;

  const text = extractText(container.children as RootContent[]);
  // Trim trailing newline that may result from structure
  return text.replace(/\n$/, "");
}

export function htmlToMarkdown(input: string): string {
  const extracted = tryExtractSyntaxHighlighted(input);
  if (extracted !== null) return extracted;
  return turndown.turndown(input);
}
