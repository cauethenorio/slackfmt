import type { Element, ElementContent, Root } from "hast";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import type { Plugin } from "unified";
import { unified } from "unified";

export type Mark = "bold" | "italic" | "strike";

const MARK_OF_TAG: Record<string, Mark> = {
  b: "bold",
  strong: "bold",
  i: "italic",
  em: "italic",
  del: "strike",
  s: "strike",
  strike: "strike",
};

const INLINE_TAGS = new Set(
  "a abbr b bdi bdo big br cite code data del dfn em font i img ins kbd label mark q s samp small span strike strong sub sup time tt u var wbr".split(
    " ",
  ),
);

/** What an element's own style turns on, and off. */
function styleMarks(element: Element): { on: Mark[]; off: Mark[] } {
  const style = element.properties?.style;
  const on: Mark[] = [];
  const off: Mark[] = [];
  if (typeof style !== "string") return { on, off };
  const value = (name: string) =>
    new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, "i").exec(style)?.[1].trim().toLowerCase();

  const weight = value("font-weight") ?? "";
  const number = Number.parseInt(weight, 10);
  if (/^bold(er)?\b/.test(weight) || number >= 600) on.push("bold");
  else if (/^(normal|lighter|initial)\b/.test(weight) || number < 600) off.push("bold");
  const slant = value("font-style") ?? "";
  if (/^(italic|oblique)\b/.test(slant)) on.push("italic");
  else if (/^(normal|initial)\b/.test(slant)) off.push("italic");
  const line = `${value("text-decoration") ?? ""} ${value("text-decoration-line") ?? ""}`;
  if (line.includes("line-through")) on.push("strike");
  return { on, off };
}

function isInline(node: ElementContent): boolean {
  if (node.type !== "element") return true;
  return INLINE_TAGS.has(node.tagName) && node.children.every(isInline);
}

/** Whether something inside turns one of these marks off again. */
function turnsOff(node: ElementContent, marks: Set<Mark>): boolean {
  if (node.type !== "element") return false;
  return (
    styleMarks(node).off.some((mark) => marks.has(mark)) ||
    node.children.some((child) => turnsOff(child, marks))
  );
}

function hasText(node: ElementContent): boolean {
  if (node.type === "text") return node.value.trim() !== "";
  return node.type === "element" && node.children.some(hasText);
}

/**
 * Wraps the text that CSS marks in spans naming its marks.
 * `wanted` are the marks its ancestors' styles ask for that nothing around it gives yet,
 * `given` the marks something around it gives already.
 */
function applyMarks(parent: Root | Element, wanted: Set<Mark>, given: Set<Mark>): void {
  const children: ElementContent[] = [];
  let run: ElementContent[] = [];

  const endRun = () => {
    const marked = wanted.size > 0 && run.some(hasText);
    const inner = marked ? new Set([...given, ...wanted]) : given;
    for (const node of run) if (node.type === "element") applyToElement(node, new Set(), inner);
    if (marked) {
      const dataMarks = [...wanted].join(" ");
      children.push({ type: "element", tagName: "span", properties: { dataMarks }, children: run });
    } else {
      children.push(...run);
    }
    run = [];
  };

  for (const node of parent.children as ElementContent[]) {
    if (isInline(node) && !turnsOff(node, wanted)) {
      run.push(node);
      continue;
    }
    endRun();
    if (node.type === "element") applyToElement(node, wanted, given);
    children.push(node);
  }
  endRun();
  parent.children = children;
}

function applyToElement(element: Element, wanted: Set<Mark>, given: Set<Mark>): void {
  if (element.tagName === "code" || element.tagName === "pre") return;
  const { on, off } = styleMarks(element);
  const tagMark = MARK_OF_TAG[element.tagName];
  const around = new Set(given);
  if (tagMark && (given.has(tagMark) || (tagMark === "bold" && off.includes("bold")))) {
    element.tagName = "span";
  } else if (tagMark) {
    around.add(tagMark);
  }

  const next = new Set([...wanted, ...on].filter((mark) => !off.includes(mark)));
  for (const mark of around) next.delete(mark);
  applyMarks(element, next, around);
}

const rehypeCssMarks: Plugin<[], Root> = () => (tree) => applyMarks(tree, new Set(), new Set());

const processor = unified().use(rehypeParse).use(rehypeCssMarks).use(rehypeStringify);

/** HTML whose marks are set in CSS, with that text in spans that name the marks (data-marks). */
export function markCssMarks(html: string): string {
  return /\bstyle\s*=/i.test(html) ? String(processor.processSync(html)) : html;
}
