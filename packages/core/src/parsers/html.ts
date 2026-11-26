import type { Element, Root, RootContent, Text } from "hast";
import type { Nodes } from "mdast";
import rehypeParse from "rehype-parse";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
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

const SOURCE_LANGUAGES = new Set(["markdown", "md", "plaintext", "plain", "text", "txt"]);

/** The <code> a <pre> holds alone, with the language its class names ("" for none). */
function loneCode(pre: Element): { code: Element; language: string } | null {
  const children = pre.children.filter((child) => child.type !== "text" || child.value.trim());
  const [code] = children;
  if (children.length !== 1 || code.type !== "element" || code.tagName !== "code") return null;
  const classes = (code.properties?.className as string[] | undefined) ?? [];
  const language = classes.map((name) => /^lang(?:uage)?-(.+)$/.exec(name)?.[1]).find(Boolean);
  return { code, language: language?.toLowerCase() ?? "" };
}

function textOf(nodes: RootContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value.replace(/\s+/g, "");
      return node.type === "element" ? textOf(node.children as RootContent[]) : "";
    })
    .join("");
}

const MARKDOWN_MARKS = new Set([
  "heading",
  "strong",
  "emphasis",
  "delete",
  "inlineCode",
  "list",
  "blockquote",
  "thematicBreak",
  "table",
  "image",
]);

/** Whether the text holds Markdown's own marks. Code holds indented lines, tags and bare URLs too. */
function holdsMarkdown(text: string): boolean {
  const marked = (node: Nodes): boolean => {
    const first = text[node.position?.start.offset ?? 0];
    if (MARKDOWN_MARKS.has(node.type)) return true;
    if (node.type === "link") return first === "[" || first === "<";
    if (node.type === "code") return first === "`" || first === "~";
    return "children" in node && node.children.some(marked);
  };
  return marked(unified().use(remarkParse).use(remarkGfm).parse(text));
}

function tryExtractSyntaxHighlighted(input: string): string | null {
  const tree = unified().use(rehypeParse, { fragment: false }).parse(input) as Root;

  const container = findPreformattedContainer(tree.children as RootContent[]);
  if (!container) return null;

  // A <pre> holding only a <code> is a code block when it names a programming language, or sits
  // beside other text. Otherwise it may be the copy's Markdown source, as a hand copy out of a
  // chat's code block is.
  const lone = container.tagName === "pre" ? loneCode(container) : null;
  if (lone?.language && !SOURCE_LANGUAGES.has(lone.language)) return null;
  if (lone && textOf(tree.children as RootContent[]) !== textOf([lone.code])) return null;
  const source = lone?.code ?? container;

  // Check all children are presentational only
  if (!source.children.every((c) => isPresentationalOnly(c as RootContent))) return null;

  const text = extractText(source.children as RootContent[]);
  // With no language named, only Markdown's marks tell a draft from code.
  if (lone && !lone.language && !holdsMarkdown(text)) return null;
  // Trim trailing newline that may result from structure
  return text.replace(/\n$/, "");
}

export function htmlToMarkdown(input: string): string {
  const extracted = tryExtractSyntaxHighlighted(input);
  if (extracted !== null) return extracted;
  return turndown.turndown(input);
}
