import { describe, expect, it } from "vitest";
import { markdownToDelta } from "../src/serializers/markdown-to-delta.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("markdownToDelta", () => {
  it("converts plain text", () => {
    expect(markdownToDelta("hello")).toBe(delta({ insert: "hello\n" }));
  });

  it("separates paragraphs with blank line", () => {
    expect(markdownToDelta("Markdown syntax guide\n\nHeaders")).toBe(
      delta({ insert: "Markdown syntax guide\n\nHeaders\n" }),
    );
  });

  it("converts bold", () => {
    expect(markdownToDelta("**hello**")).toBe(
      delta({ insert: "hello", attributes: { bold: true } }, { insert: "\n" }),
    );
  });

  it("converts italic", () => {
    expect(markdownToDelta("*hello*")).toBe(
      delta({ insert: "hello", attributes: { italic: true } }, { insert: "\n" }),
    );
  });

  it("converts strikethrough", () => {
    expect(markdownToDelta("~~hello~~")).toBe(
      delta({ insert: "hello", attributes: { strike: true } }, { insert: "\n" }),
    );
  });

  it("converts inline code", () => {
    expect(markdownToDelta("`code`")).toBe(
      delta({ insert: "code", attributes: { code: true } }, { insert: "\n" }),
    );
  });

  it("converts link", () => {
    expect(markdownToDelta("[click](https://example.com)")).toBe(
      delta({ insert: "click", attributes: { link: "https://example.com" } }, { insert: "\n" }),
    );
  });

  it("converts bold + italic", () => {
    expect(markdownToDelta("***both***")).toBe(
      delta({ insert: "both", attributes: { italic: true, bold: true } }, { insert: "\n" }),
    );
  });

  it("converts bold + link", () => {
    expect(markdownToDelta("[**click**](https://example.com)")).toBe(
      delta(
        { insert: "click", attributes: { link: "https://example.com", bold: true } },
        { insert: "\n" },
      ),
    );
  });

  it("converts bullet list", () => {
    expect(markdownToDelta("- one\n- two")).toBe(
      delta(
        { insert: "one" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "two" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });

  it("converts ordered list", () => {
    expect(markdownToDelta("1. first\n2. second")).toBe(
      delta(
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered" } },
      ),
    );
  });

  it("converts nested list", () => {
    expect(markdownToDelta("- parent\n  - child")).toBe(
      delta(
        { insert: "parent" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "child" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
      ),
    );
  });

  it("converts 2-space indented sub-list under ordered list", () => {
    expect(markdownToDelta("1. First\n2. Second\n  - Sub\n  - Def")).toBe(
      delta(
        { insert: "First" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "Second" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "Sub" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "Def" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
      ),
    );
  });

  it("converts deeply nested list", () => {
    expect(markdownToDelta("- a\n  - b\n    - c")).toBe(
      delta(
        { insert: "a" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "b" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "c" },
        { insert: "\n", attributes: { list: "bullet", indent: 2 } },
      ),
    );
  });

  it("converts heading h1", () => {
    expect(markdownToDelta("# Title")).toBe(
      delta({ insert: "Title" }, { insert: "\n", attributes: { header: 1 } }),
    );
  });

  it("converts heading h2", () => {
    expect(markdownToDelta("## Sub")).toBe(
      delta({ insert: "Sub" }, { insert: "\n", attributes: { header: 2 } }),
    );
  });

  it("converts code block", () => {
    expect(markdownToDelta("```\nconst x = 1;\n```")).toBe(
      delta({ insert: "const x = 1;" }, { insert: "\n", attributes: { "code-block": true } }),
    );
  });

  it("converts multi-line code block", () => {
    expect(markdownToDelta("```\nconst x = 1;\nconst y = 2;\n```")).toBe(
      delta(
        { insert: "const x = 1;" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "const y = 2;" },
        { insert: "\n", attributes: { "code-block": true } },
      ),
    );
  });

  it("converts blockquote", () => {
    expect(markdownToDelta("> quoted")).toBe(
      delta({ insert: "quoted" }, { insert: "\n", attributes: { blockquote: true } }),
    );
  });

  it("converts multi-line blockquote", () => {
    expect(markdownToDelta("> line one\n> line two")).toBe(
      delta(
        { insert: "line one" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "line two" },
        { insert: "\n", attributes: { blockquote: true } },
      ),
    );
  });

  it("converts paragraph then list", () => {
    expect(markdownToDelta("intro\n\n- item")).toBe(
      delta({ insert: "intro\n\nitem" }, { insert: "\n", attributes: { list: "bullet" } }),
    );
  });

  it("converts combined formatting in list", () => {
    expect(markdownToDelta("- **bold item**")).toBe(
      delta(
        { insert: "bold item", attributes: { bold: true } },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });
});
