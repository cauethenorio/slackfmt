import type { Element, Root, RootContent, Text } from "hast";
import rehypeParse from "rehype-parse";
import TurndownService from "turndown";
import { unified } from "unified";
import { type Mark, markCssMarks } from "./css-marks.js";

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

const MARKERS: Record<Mark, string> = { bold: "**", italic: "*", strike: "~~" };

turndown.addRule("cssMarks", {
  filter(node) {
    return node.hasAttribute("data-marks");
  },
  replacement(content, node) {
    if (!content.trim()) return content;
    const marks = ((node as HTMLElement).getAttribute("data-marks") ?? "").split(" ") as Mark[];
    const marked = content
      .split(/(\n\s*\n)/)
      .map((block) => mark(block, marks))
      .join("");
    const before = seam(node, "previousSibling", content[0]);
    const after = seam(node, "nextSibling", content[content.length - 1]);
    return before + marked + after;
  },
});

/** Markers touch the text: a space or break outside them, a tilde beside a strikethrough's escaped. */
function mark(block: string, marks: Mark[]): string {
  const [, before, trimmed, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(block) as RegExpExecArray;
  if (!trimmed) return block;
  const open = marks.map((name) => MARKERS[name]).join("");
  const close = [...open].reverse().join("");
  const text = marks.includes("strike")
    ? trimmed.replace(/^~/, "\\~").replace(/([^\\])~$/, "$1\\~")
    : trimmed;
  return before + open + text + close + after;
}

const MARKED = /^(B|STRONG|I|EM|DEL|S|STRIKE)$/;
const BLOCK =
  /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|BODY|BR|DD|DIV|DL|DT|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|HTML|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL|X-TURNDOWN)$/;

/**
 * Markdown reads a marker by the characters on either side of it. Between marked text and
 * other marked text, or between a word and marked punctuation, an empty tag lets it read both.
 */
function seam(
  node: TurndownService.Node,
  side: "previousSibling" | "nextSibling",
  edge: string,
): string {
  const neighbour = neighbourOf(node, side);
  if (!neighbour || /\s/.test(neighbour.character + edge)) return "";
  const punctuation = /[\p{P}\p{S}]/u;
  const word = !punctuation.test(neighbour.character);
  return neighbour.marked || (word && punctuation.test(edge)) ? "<wbr>" : "";
}

function isMarked(node: Node): boolean {
  return MARKED.test(node.nodeName) || !!(node as HTMLElement).getAttribute?.("data-marks");
}

function neighbourOf(
  from: Node,
  side: "previousSibling" | "nextSibling",
): { character: string; marked: boolean } | null {
  const end = side === "previousSibling" ? "lastChild" : "firstChild";
  for (let node: Node | null = from; node && !BLOCK.test(node.nodeName); node = node.parentNode) {
    // A parent's own marker stands between this and whatever is past it.
    if (node !== from && isMarked(node)) return null;
    for (let sibling = node[side]; sibling; sibling = sibling[side]) {
      if (BLOCK.test(sibling.nodeName)) return null;
      const text = sibling.textContent ?? "";
      if (!text) continue;
      let marked = false;
      for (let leaf: Node | null = sibling; leaf; leaf = leaf[end]) {
        marked ||= isMarked(leaf);
      }
      return { character: side === "previousSibling" ? text[text.length - 1] : text[0], marked };
    }
  }
  return null;
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
  return turndown.turndown(markCssMarks(input));
}
