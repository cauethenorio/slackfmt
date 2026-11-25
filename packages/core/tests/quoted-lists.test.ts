import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const quotedList = delta(
  { insert: "Packing for the lake" },
  { insert: "\n", attributes: { blockquote: true } },
  { insert: "Blue kayak" },
  { insert: "\n", attributes: { list: "bullet", border: 1 } },
  { insert: "Two paddles" },
  { insert: "\n", attributes: { list: "bullet", border: 1 } },
);

describe("lists inside quotes", () => {
  it("keeps every line of the list inside the quote, as Slack copies one", async () => {
    const result = await convert("> Packing for the lake\n> - Blue kayak\n> - Two paddles", {
      format: "markdown",
    });
    expect(result).toBe(quotedList);
  });

  it("keeps an HTML list inside its quote", async () => {
    const result = await convert(
      "<blockquote><p>Packing for the lake</p><ul><li>Blue kayak</li><li>Two paddles</li></ul></blockquote>",
      { format: "html" },
    );
    expect(result).toBe(quotedList);
  });

  it("keeps an ordered list inside the quote", async () => {
    const result = await convert("> 1. first\n> 2. second", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered", border: 1 } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered", border: 1 } },
      ),
    );
  });

  it("keeps a nested list inside the quote", async () => {
    const result = await convert("> - outer\n>   - inner\n>     - innermost", {
      format: "markdown",
    });
    expect(result).toBe(
      delta(
        { insert: "outer" },
        { insert: "\n", attributes: { list: "bullet", border: 1 } },
        { insert: "inner" },
        { insert: "\n", attributes: { list: "bullet", indent: 1, border: 1 } },
        { insert: "innermost" },
        { insert: "\n", attributes: { list: "bullet", indent: 2, border: 1 } },
      ),
    );
  });

  it("keeps the quote's text after the list quoted, and the list after the quote unquoted", async () => {
    const result = await convert("> before\n>\n> - item\n>\n> after\n\n- outside", {
      format: "markdown",
    });
    expect(result).toBe(
      delta(
        { insert: "before" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "item" },
        { insert: "\n", attributes: { list: "bullet", border: 1 } },
        { insert: "after" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "\noutside" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });

  it("roundtrips a quoted list", async () => {
    expect(await convert(quotedList, { format: "quill-delta" })).toBe(quotedList);
  });

  it("roundtrips nested, ordered and surrounded quoted lists", async () => {
    const markdown = [
      "> before",
      ">",
      "> 1. first",
      ">    - nested",
      "> 2. second",
      ">",
      "> after",
      "",
      "- outside",
    ].join("\n");
    const once = await convert(markdown, { format: "markdown" });
    expect(await convert(once, { format: "quill-delta" })).toBe(once);
  });
});
