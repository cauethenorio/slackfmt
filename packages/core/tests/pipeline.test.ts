import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("convert markdown to quill delta", () => {
  it("converts bold text", async () => {
    const result = await convert("**hello**", { format: "markdown" });
    expect(result).toBe(delta({ insert: "hello", attributes: { bold: true } }, { insert: "\n" }));
  });

  it("converts italic text", async () => {
    const result = await convert("*hello*", { format: "markdown" });
    expect(result).toBe(delta({ insert: "hello", attributes: { italic: true } }, { insert: "\n" }));
  });

  it("converts strikethrough text", async () => {
    const result = await convert("~~hello~~", { format: "markdown" });
    expect(result).toBe(delta({ insert: "hello", attributes: { strike: true } }, { insert: "\n" }));
  });

  it("converts inline code", async () => {
    const result = await convert("`code`", { format: "markdown" });
    expect(result).toBe(delta({ insert: "code", attributes: { code: true } }, { insert: "\n" }));
  });

  it("converts a link", async () => {
    const result = await convert("[click](https://example.com)", { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "click", attributes: { link: "https://example.com" } }, { insert: "\n" }),
    );
  });

  it("converts unordered list", async () => {
    const result = await convert("- item 1\n- item 2", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "item 1" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "item 2" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });

  it("converts ordered list", async () => {
    const result = await convert("1. first\n2. second", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered" } },
      ),
    );
  });

  it("converts nested list", async () => {
    const result = await convert("- parent\n  - child", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "parent" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "child" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
      ),
    );
  });

  it("converts code block", async () => {
    const result = await convert("```\nconst x = 1;\n```", { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "const x = 1;" }, { insert: "\n", attributes: { "code-block": true } }),
    );
  });

  it("converts heading to bold", async () => {
    const result = await convert("# Hello", { format: "markdown" });
    expect(result).toBe(delta({ insert: "Hello", attributes: { bold: true } }, { insert: "\n" }));
  });

  it("converts blockquote", async () => {
    const result = await convert("> quoted text", { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "quoted text" }, { insert: "\n", attributes: { blockquote: true } }),
    );
  });

  it("converts plain text", async () => {
    const result = await convert("hello", { format: "markdown" });
    expect(result).toBe(delta({ insert: "hello\n" }));
  });

  it("handles combined formatting", async () => {
    const result = await convert("**bold** and *italic* and `code`", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "bold", attributes: { bold: true } },
        { insert: " and " },
        { insert: "italic", attributes: { italic: true } },
        { insert: " and " },
        { insert: "code", attributes: { code: true } },
        { insert: "\n" },
      ),
    );
  });

  it("converts paragraph then list", async () => {
    const result = await convert("Line 1\n\n- item 1\n- item 2", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "Line 1\n\nitem 1" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "item 2" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });
});

describe("convert html to quill delta (end-to-end)", () => {
  it("converts bold html", async () => {
    const result = await convert("<strong>hello</strong>", { format: "html" });
    expect(result).toBe(delta({ insert: "hello", attributes: { bold: true } }, { insert: "\n" }));
  });

  it("converts a link", async () => {
    const result = await convert('<a href="https://example.com">link</a>', { format: "html" });
    expect(result).toBe(
      delta({ insert: "link", attributes: { link: "https://example.com" } }, { insert: "\n" }),
    );
  });
});

describe("convert quill delta to quill delta (roundtrip)", () => {
  it("roundtrips bold delta", async () => {
    const input = JSON.stringify({
      ops: [{ insert: "hello", attributes: { bold: true } }, { insert: "\n" }],
    });
    const result = await convert(input, { format: "quill-delta" });
    expect(result).toBe(delta({ insert: "hello", attributes: { bold: true } }, { insert: "\n" }));
  });

  it("roundtrips bullet list delta", async () => {
    const input = JSON.stringify({
      ops: [{ insert: "item" }, { insert: "\n", attributes: { list: "bullet" } }],
    });
    const result = await convert(input, { format: "quill-delta" });
    expect(result).toBe(
      delta({ insert: "item" }, { insert: "\n", attributes: { list: "bullet" } }),
    );
  });
});
