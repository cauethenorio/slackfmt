import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/parsers/html.js";

describe("htmlToMarkdown", () => {
  describe("syntax-highlighted markdown (pre + spans with br)", () => {
    it("should extract a heading from syntax-highlighted HTML", () => {
      const input = `<pre><span style="color:#cf222e;"># </span><span style="color:#0550ae;">Hello World</span></pre>`;
      expect(htmlToMarkdown(input)).toBe("# Hello World");
    });

    it("should extract bold text from syntax-highlighted HTML", () => {
      const input = `<pre><span style="color:#cf222e;">**</span><span style="color:#0550ae;">bold text</span><span style="color:#cf222e;">**</span></pre>`;
      expect(htmlToMarkdown(input)).toBe("**bold text**");
    });

    it("should extract a fenced code block from syntax-highlighted HTML", () => {
      const input = [
        `<pre>`,
        `<span style="color:#cf222e;">\`\`\`js</span><br>`,
        `<span style="color:#0550ae;">const x = 1;</span><br>`,
        `<span style="color:#cf222e;">\`\`\`</span>`,
        `</pre>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe("```js\nconst x = 1;\n```");
    });

    it("should extract multi-line markdown from syntax-highlighted HTML", () => {
      const input = [
        `<pre>`,
        `<span style="color:#cf222e;"># </span><span style="color:#0550ae;">Title</span><br>`,
        `<br>`,
        `<span style="color:#24292f;">Some paragraph text.</span><br>`,
        `<br>`,
        `<span style="color:#cf222e;">- </span><span style="color:#24292f;">item one</span><br>`,
        `<span style="color:#cf222e;">- </span><span style="color:#24292f;">item two</span>`,
        `</pre>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe(
        "# Title\n\nSome paragraph text.\n\n- item one\n- item two",
      );
    });
  });

  describe("syntax-highlighted markdown (div with white-space: pre)", () => {
    it("should extract a heading from div-based syntax-highlighted HTML", () => {
      const input = [
        `<div style="white-space: pre;">`,
        `<div><span style="color:#cf222e;"># </span><span style="color:#0550ae;">Hello World</span></div>`,
        `</div>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe("# Hello World");
    });

    it("should extract bold and italic from div-based syntax-highlighted HTML", () => {
      const input = [
        `<div style="white-space: pre;">`,
        `<div><span style="color:#cf222e;">**</span><span style="color:#0550ae;">bold</span><span style="color:#cf222e;">**</span><span style="color:#24292f;"> and </span><span style="color:#cf222e;">*</span><span style="color:#0550ae;">italic</span><span style="color:#cf222e;">*</span></div>`,
        `</div>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe("**bold** and *italic*");
    });

    it("should extract multi-line content from div-based syntax-highlighted HTML", () => {
      const input = [
        `<div style="white-space: pre;">`,
        `<div><span style="color:#cf222e;"># </span><span style="color:#0550ae;">Title</span></div>`,
        `<div><span style="color:#24292f;"></span></div>`,
        `<div><span style="color:#24292f;">A paragraph.</span></div>`,
        `</div>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe("# Title\n\nA paragraph.");
    });

    it("should extract a code block from div-based syntax-highlighted HTML", () => {
      const input = [
        `<div style="white-space: pre;">`,
        `<div><span style="color:#cf222e;">\`\`\`typescript</span></div>`,
        `<div><span style="color:#0550ae;">function hello() {}</span></div>`,
        `<div><span style="color:#cf222e;">\`\`\`</span></div>`,
        `</div>`,
      ].join("");
      expect(htmlToMarkdown(input)).toBe("```typescript\nfunction hello() {}\n```");
    });
  });

  describe("regular HTML (should still use Turndown)", () => {
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

    it("converts paragraph tags", () => {
      expect(htmlToMarkdown("<p>Some text here.</p>")).toBe("Some text here.");
    });

    it("handles mixed semantic HTML", () => {
      const input = `<h2>Title</h2><p>A <strong>bold</strong> paragraph with a <a href="https://example.com">link</a>.</p>`;
      const result = htmlToMarkdown(input);
      expect(result).toContain("Title");
      expect(result).toContain("**bold**");
      expect(result).toContain("[link](https://example.com)");
    });
  });
});
