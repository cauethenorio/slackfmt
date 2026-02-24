import type { Element, Root, RootContent, Text } from "hast";
import rehypeParse from "rehype-parse";
import { unified } from "unified";

const parser = unified().use(rehypeParse, { fragment: true });

function textContent(node: RootContent): string {
  if (node.type === "text") return (node as Text).value;
  if (node.type === "element") {
    return (node as Element).children.map(textContent).join("");
  }
  return "";
}

function convertNode(node: RootContent): string {
  if (node.type === "text") return (node as Text).value;
  if (node.type !== "element") return "";

  const el = node as Element;
  const props = el.properties ?? {};
  const stringifyType = props.dataStringifyType as string | undefined;

  // Skip meta tags
  if (el.tagName === "meta") return "";

  // Paragraph-break span → blank line
  if (stringifyType === "paragraph-break") return "\n\n";

  // Emoji image → shortcode
  if (stringifyType === "emoji") {
    return (props.dataStringifyEmoji as string) ?? (props.alt as string) ?? "";
  }

  // Line break
  if (el.tagName === "br") return "\n";

  // Bold
  if (stringifyType === "bold") return `**${convertChildren(el)}**`;

  // Italic
  if (stringifyType === "italic") return `*${convertChildren(el)}*`;

  // Strikethrough
  if (stringifyType === "strike") return `~~${convertChildren(el)}~~`;

  // Inline code
  if (stringifyType === "code") return `\`${textContent(el)}\``;

  // Code block
  if (stringifyType === "pre") {
    const code = textContent(el).replace(/\n$/, "");
    return `\`\`\`\n${code}\n\`\`\``;
  }

  // Blockquote
  if (stringifyType === "quote") {
    const inner = convertChildren(el).trim();
    return inner
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  // Lists
  if (stringifyType === "unordered-list" || stringifyType === "ordered-list") {
    return convertList(el, stringifyType === "ordered-list");
  }

  // Link
  if (el.tagName === "a") {
    const href = (props.dataStringifyLink ?? props.href) as string;
    const text = convertChildren(el);
    return `[${text}](${href})`;
  }

  // Section wrapper — unwrap
  const className = props.className;
  if (
    el.tagName === "div" &&
    Array.isArray(className) &&
    className.includes("p-rich_text_section")
  ) {
    return convertChildren(el);
  }

  // Default: process children
  return convertChildren(el);
}

function convertChildren(el: Element): string {
  return el.children.map(convertNode).join("");
}

function convertList(el: Element, ordered: boolean): string {
  const lines: string[] = [];
  const indent = Number(el.properties?.dataIndent ?? 0);
  const prefix = "  ".repeat(indent);
  let counter = 1;

  for (const child of el.children) {
    if (child.type !== "element" || (child as Element).tagName !== "li") continue;
    const li = child as Element;

    // Separate inline content from nested sublists
    const inlineParts: string[] = [];
    const sublistParts: string[] = [];

    for (const liChild of li.children) {
      if (
        liChild.type === "element" &&
        ((liChild as Element).properties?.dataStringifyType === "unordered-list" ||
          (liChild as Element).properties?.dataStringifyType === "ordered-list")
      ) {
        sublistParts.push(convertNode(liChild));
      } else {
        inlineParts.push(convertNode(liChild));
      }
    }

    const bullet = ordered ? `${counter}. ` : "- ";
    lines.push(`${prefix}${bullet}${inlineParts.join("").trim()}`);
    counter++;

    for (const sub of sublistParts) {
      lines.push(sub);
    }
  }

  return lines.join("\n");
}

export function slackHtmlToMarkdown(input: string): string {
  const tree = parser.parse(input) as Root;
  const parts: string[] = [];

  for (const child of tree.children) {
    parts.push(convertNode(child));
  }

  return parts.join("").trim();
}
