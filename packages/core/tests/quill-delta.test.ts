import { describe, expect, it } from "vitest";
import { quillDeltaToMarkdown } from "../src/parsers/quill-delta.js";

describe("quillDeltaToMarkdown", () => {
  it("converts plain text", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "hello\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("hello");
  });

  it("converts bold", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "hello", attributes: { bold: true } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("**hello**");
  });

  it("converts italic", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "hello", attributes: { italic: true } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("*hello*");
  });

  it("converts strikethrough", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "hello", attributes: { strike: true } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("~~hello~~");
  });

  it("converts inline code", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "x", attributes: { code: true } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("`x`");
  });

  it("converts link", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "click", attributes: { link: "https://example.com" } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("[click](https://example.com)");
  });

  it("converts bullet list", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "one" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "two" },
        { insert: "\n", attributes: { list: "bullet" } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("- one\n- two");
  });

  it("converts ordered list", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered" } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("1. first\n2. second");
  });

  it("converts nested list with indent", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "parent" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "child" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("- parent\n  - child");
  });

  it("converts header", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "Title" }, { insert: "\n", attributes: { header: 1 } }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("# Title");
  });

  it("converts h2", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "Sub" }, { insert: "\n", attributes: { header: 2 } }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("## Sub");
  });

  it("converts code block", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "const x = 1;" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "const y = 2;" },
        { insert: "\n", attributes: { "code-block": true } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("```\nconst x = 1;\nconst y = 2;\n```");
  });

  it("converts blockquote", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "quoted" }, { insert: "\n", attributes: { blockquote: true } }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("> quoted");
  });

  it("handles mixed paragraph then list", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "intro\n" },
        { insert: "item" },
        { insert: "\n", attributes: { list: "bullet" } },
      ],
    });
    const md = quillDeltaToMarkdown(delta);
    expect(md).toContain("intro");
    expect(md).toContain("- item");
  });

  it("converts combined bold + italic", () => {
    const delta = JSON.stringify({
      ops: [{ insert: "both", attributes: { bold: true, italic: true } }, { insert: "\n" }],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("***both***");
  });

  it("converts combined bold + link", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "click", attributes: { bold: true, link: "https://example.com" } },
        { insert: "\n" },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("[**click**](https://example.com)");
  });

  it("converts multi-line blockquote", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "line one" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "line two" },
        { insert: "\n", attributes: { blockquote: true } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("> line one\n> line two");
  });

  it("converts deeply nested list", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "level 0" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "level 1" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "level 2" },
        { insert: "\n", attributes: { list: "bullet", indent: 2 } },
      ],
    });
    expect(quillDeltaToMarkdown(delta)).toBe("- level 0\n  - level 1\n    - level 2");
  });

  it("resets ordered list numbering after non-list content", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "a" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "b" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "break\n" },
        { insert: "c" },
        { insert: "\n", attributes: { list: "ordered" } },
      ],
    });
    const md = quillDeltaToMarkdown(delta);
    expect(md).toBe("1. a\n2. b\nbreak\n1. c");
  });

  it("converts mixed list types (ordered with nested bullets)", () => {
    const delta = JSON.stringify({
      ops: [
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "sub bullet" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered" } },
      ],
    });
    const md = quillDeltaToMarkdown(delta);
    expect(md).toContain("1. first");
    expect(md).toContain("  - sub bullet");
    expect(md).toContain("2. second");
  });
});
