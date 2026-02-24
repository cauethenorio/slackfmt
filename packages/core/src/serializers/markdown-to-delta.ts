import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

interface DeltaOp {
  insert: string;
  attributes?: Record<string, unknown>;
}

type InlineAttrs = Record<string, unknown>;
type BlockAttrs = Record<string, unknown>;

const parser = unified().use(remarkParse).use(remarkGfm);

export function markdownToDelta(markdown: string): string {
  const tree = parser.parse(markdown) as Root;
  const ops: DeltaOp[] = [];
  processRootNodes(tree.children, ops);
  return JSON.stringify({ ops: compactOps(ops) });
}

/**
 * Process root-level nodes with blank-line separation between blocks.
 * An extra \n is inserted only when the source markdown has a blank line
 * between two consecutive blocks (detected via MDAST position info).
 *
 * Also detects indented lists that remark parsed as separate root siblings
 * (e.g. 2-space indent under an ordered list) and treats them as nested.
 */
function processRootNodes(nodes: RootContent[], ops: DeltaOp[]): void {
  let listDepth = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (i > 0) {
      const prev = nodes[i - 1];
      const prevEnd = prev.position?.end.line ?? 0;
      const currStart = node.position?.start.line ?? 0;

      // Indented list following another list → treat as nested (depth+1)
      if (node.type === "list" && prev.type === "list" && (node.position?.start.column ?? 1) > 1) {
        listDepth++;
        processNode(node, ops, {}, {}, listDepth);
        continue;
      }

      if (currStart - prevEnd > 1) {
        pushNewline(ops, {});
      }
    }

    listDepth = 0;
    processNode(node, ops, {}, {}, listDepth);
  }
}

/**
 * Merge consecutive ops that share the same attributes.
 */
function compactOps(ops: DeltaOp[]): DeltaOp[] {
  const result: DeltaOp[] = [];
  for (const op of ops) {
    const last = result[result.length - 1];
    if (last && sameAttrs(last.attributes, op.attributes)) {
      last.insert += op.insert;
    } else {
      result.push({ insert: op.insert, ...(op.attributes ? { attributes: op.attributes } : {}) });
    }
  }
  return result;
}

function sameAttrs(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

function processNodes(
  nodes: RootContent[],
  ops: DeltaOp[],
  inlineAttrs: InlineAttrs,
  blockAttrs: BlockAttrs,
  listDepth: number,
): void {
  for (const node of nodes) {
    processNode(node, ops, inlineAttrs, blockAttrs, listDepth);
  }
}

function processNode(
  node: RootContent,
  ops: DeltaOp[],
  inlineAttrs: InlineAttrs,
  blockAttrs: BlockAttrs,
  listDepth: number,
): void {
  switch (node.type) {
    case "text": {
      // Remark merges consecutive lines (no blank line) into one text node with \n.
      // Split into separate lines so each \n becomes a proper line break op.
      if (node.value.includes("\n")) {
        const lines = node.value.split("\n");
        for (let idx = 0; idx < lines.length; idx++) {
          pushInsert(ops, lines[idx], inlineAttrs);
          if (idx < lines.length - 1) {
            pushNewline(ops, blockAttrs);
          }
        }
      } else {
        pushInsert(ops, node.value, inlineAttrs);
      }
      break;
    }

    case "strong":
      processNodes(node.children, ops, { ...inlineAttrs, bold: true }, blockAttrs, listDepth);
      break;

    case "emphasis":
      processNodes(node.children, ops, { ...inlineAttrs, italic: true }, blockAttrs, listDepth);
      break;

    case "delete":
      processNodes(node.children, ops, { ...inlineAttrs, strike: true }, blockAttrs, listDepth);
      break;

    case "inlineCode":
      pushInsert(ops, node.value, { ...inlineAttrs, code: true });
      break;

    case "link":
      processNodes(node.children, ops, { ...inlineAttrs, link: node.url }, blockAttrs, listDepth);
      break;

    case "paragraph":
      processNodes(node.children, ops, inlineAttrs, blockAttrs, listDepth);
      pushNewline(ops, blockAttrs);
      break;

    case "heading":
      processNodes(node.children, ops, inlineAttrs, blockAttrs, listDepth);
      pushNewline(ops, { header: node.depth });
      break;

    case "list":
      for (const item of node.children) {
        if (item.type !== "listItem") continue;
        const listType = node.ordered ? "ordered" : "bullet";
        const itemBlockAttrs: BlockAttrs = { list: listType };
        if (listDepth > 0) {
          itemBlockAttrs.indent = listDepth;
        }
        processListItem(item.children, ops, itemBlockAttrs, listDepth);
      }
      break;

    case "code":
      for (const line of node.value.split("\n")) {
        pushInsert(ops, line, {});
        pushNewline(ops, { "code-block": true });
      }
      break;

    case "blockquote":
      processNodes(node.children, ops, inlineAttrs, { blockquote: true }, listDepth);
      break;

    default:
      if ("children" in node) {
        processNodes(
          (node as { children: RootContent[] }).children,
          ops,
          inlineAttrs,
          blockAttrs,
          listDepth,
        );
      }
      break;
  }
}

/**
 * Process children of a listItem. The listItem wraps its content in a <paragraph>,
 * and may contain nested lists. We need to:
 * - Emit inline content from the paragraph with the list's block attrs on the \n
 * - Process nested lists at depth+1
 */
function processListItem(
  children: RootContent[],
  ops: DeltaOp[],
  blockAttrs: BlockAttrs,
  listDepth: number,
): void {
  for (const child of children) {
    if (child.type === "list") {
      processNode(child, ops, {}, {}, listDepth + 1);
    } else if (child.type === "paragraph") {
      processNodes(child.children, ops, {}, blockAttrs, listDepth);
      pushNewline(ops, blockAttrs);
    } else {
      processNode(child, ops, {}, blockAttrs, listDepth);
    }
  }
}

function pushInsert(ops: DeltaOp[], text: string, attrs: InlineAttrs): void {
  if (!text) return;
  const op: DeltaOp = { insert: text };
  const filtered = filterAttrs(attrs);
  if (filtered) op.attributes = filtered;
  ops.push(op);
}

function pushNewline(ops: DeltaOp[], attrs: BlockAttrs): void {
  const op: DeltaOp = { insert: "\n" };
  const filtered = filterAttrs(attrs);
  if (filtered) op.attributes = filtered;
  ops.push(op);
}

function filterAttrs(attrs: Record<string, unknown>): Record<string, unknown> | undefined {
  const entries = Object.entries(attrs).filter(([, v]) => v !== undefined && v !== false);
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}
