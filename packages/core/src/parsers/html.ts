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

const STRUCK_TAGS = ["DEL", "S", "STRIKE"];

function isStruck(node: Node | null): boolean {
  return !!node && STRUCK_TAGS.includes(node.nodeName) && !!node.textContent?.trim();
}

turndown.addRule("strikethrough", {
  filter(node) {
    return isStruck(node);
  },
  replacement(content, node) {
    // One pair of markers per run: struck text inside struck text, or right beside it, shares them.
    if ((node.parentNode as HTMLElement | null)?.closest("del, s, strike")) return content;
    const open = isStruck(node.previousSibling) ? "" : "~~";
    const close = isStruck(node.nextSibling) ? "" : "~~";
    const struck = content
      .split(/(\n\s*\n)/)
      .map((block) => strike(block, open, close))
      .join("");
    const before = open && seam(node, "previousSibling", content[0]);
    const after = close && seam(node, "nextSibling", content[content.length - 1]);
    return before + struck + after;
  },
});

/** Markers touch the text: a space or break outside them, a tilde beside them escaped. */
function strike(block: string, open: string, close: string): string {
  const [, before, text, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(block) as RegExpExecArray;
  if (!text) return block;
  const escaped = text.replace(/^~/, "\\~").replace(/([^\\])~$/, "$1\\~");
  return before + open + escaped + close + after;
}

const BLOCK =
  /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|BODY|BR|DD|DIV|DL|DT|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|HTML|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL|X-TURNDOWN)$/;

const MARKED = /^(B|STRONG|I|EM)$/;

/** Markdown reads no marker between a word and punctuation, so an empty tag goes between them. */
function seam(node: Node, side: "previousSibling" | "nextSibling", edge: string): string {
  const beside = characterBeside(node, side);
  return /[\p{P}\p{S}]/u.test(edge) && /[^\s\p{P}\p{S}]/u.test(beside) ? "<wbr>" : "";
}

function characterBeside(from: Node, side: "previousSibling" | "nextSibling"): string {
  for (let node: Node | null = from; node && !BLOCK.test(node.nodeName); node = node.parentNode) {
    // A parent's own marker stands between this and whatever is past it.
    if (node !== from && MARKED.test(node.nodeName)) return "";
    for (let sibling = node[side]; sibling; sibling = sibling[side]) {
      if (BLOCK.test(sibling.nodeName)) return "";
      const text = sibling.textContent ?? "";
      if (text) return side === "previousSibling" ? text[text.length - 1] : text[0];
    }
  }
  return "";
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
  return turndown.turndown(input);
}
