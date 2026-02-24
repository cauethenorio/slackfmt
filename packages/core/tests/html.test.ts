import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/parsers/html.js";

describe("htmlToMarkdown", () => {
  it("converts bold", () => {
    expect(htmlToMarkdown("<strong>hello</strong>")).toBe("**hello**");
  });

  it("converts italic", () => {
    expect(htmlToMarkdown("<em>hello</em>")).toBe("_hello_");
  });

  it("converts a link", () => {
    expect(htmlToMarkdown('<a href="https://example.com">click</a>')).toBe(
      "[click](https://example.com)",
    );
  });

  it("converts a heading", () => {
    expect(htmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
  });

  it("converts unordered list", () => {
    const html = "<ul><li>one</li><li>two</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("-   one");
    expect(md).toContain("-   two");
  });

  it("converts code block", () => {
    const html = "<pre><code>const x = 1;</code></pre>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("```");
    expect(md).toContain("const x = 1;");
  });

  it("converts blockquote", () => {
    const md = htmlToMarkdown("<blockquote>quoted</blockquote>");
    expect(md).toContain("> quoted");
  });
});
