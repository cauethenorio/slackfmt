import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/parsers/html.js";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

// A copy made by hand out of a Claude code block: Chromium's <meta>, then one <pre> holding one
// <code>, neither with an attribute, the <code> holding the block's text as one run.
function copied(code: string): string {
  return `<meta charset='utf-8'><pre>${code}</pre>`;
}

function escaped(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

const draft = [
  "**Garden club notes**",
  "",
  "The sale is set for *May*.",
  "",
  "- Tomato starts are in `bench/south`. [Tray list](https://example.com/trays?week=3)",
  "- The shed has a new rack.",
].join("\n");

const formatted = delta(
  { insert: "Garden club notes", attributes: { bold: true } },
  { insert: "\n\nThe sale is set for " },
  { insert: "May", attributes: { italic: true } },
  { insert: ".\n\nTomato starts are in " },
  { insert: "bench/south", attributes: { code: true } },
  { insert: ". " },
  { insert: "Tray list", attributes: { link: "https://example.com/trays?week=3" } },
  { insert: "\n", attributes: { list: "bullet" } },
  { insert: "The shed has a new rack." },
  { insert: "\n", attributes: { list: "bullet" } },
);

const plain = "Hi team,\nthe sale is on Saturday.";

describe("a whole-copy <pre><code>", () => {
  it("is read as Markdown when it names no language and holds Markdown", async () => {
    const html = copied(`<code>${draft}</code>`);
    expect(htmlToMarkdown(html)).toBe(draft);
    expect(await convert(html, { format: "html" })).toBe(formatted);
  });

  it("is read as Markdown when it names Markdown", async () => {
    for (const name of ["markdown", "md", "Markdown"]) {
      const html = copied(`<code class="language-${name}">${draft}</code>`);
      expect(await convert(html, { format: "html" })).toBe(formatted);
    }
    expect(htmlToMarkdown(copied(`<code class="language-markdown">${plain}</code>`))).toBe(plain);
  });

  it("is read as Markdown when it names plain text", async () => {
    for (const name of ["plaintext", "text", "txt", "plain"]) {
      const html = copied(`<code class="hljs language-${name}">${draft}</code>`);
      expect(await convert(html, { format: "html" })).toBe(formatted);
    }
    expect(htmlToMarkdown(copied(`<code class="lang-text">${plain}</code>`))).toBe(plain);
  });

  it("is read through syntax-highlighting spans", () => {
    const html = copied(
      '<code class="language-markdown"><span class="hljs-strong">**bold**</span> and\n<span class="hljs-bullet">-</span> item</code>',
    );
    expect(htmlToMarkdown(html)).toBe("**bold** and\n- item");
  });

  it("stays a code block when it names another language", async () => {
    const html = copied('<code class="language-python">total = a * b * c\n# not a heading</code>');
    expect(await convert(html, { format: "html" })).toBe(
      delta(
        { insert: "total = a * b * c" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "# not a heading" },
        { insert: "\n", attributes: { "code-block": true } },
      ),
    );
  });

  it("stays a code block when it names no language and holds none of Markdown's marks", () => {
    const blocks = [
      "const x = 1;",
      plain,
      "def area(w, h):\n    size = w * h\n\n    return size",
      '<div class="note">\n  <p>hello</p>\n</div>',
      "curl https://example.com/api?page=2 | head",
    ];
    for (const text of blocks) {
      expect(htmlToMarkdown(copied(`<code>${escaped(text)}</code>`))).toBe(
        `\`\`\`\n${text}\n\`\`\``,
      );
    }
  });

  it("stays a code block beside other text, with that text kept", async () => {
    const html = "<p>intro</p><pre><code>**not bold**</code></pre><p>after</p>";
    expect(await convert(html, { format: "html" })).toBe(
      delta(
        { insert: "intro\n\n**not bold**" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "\nafter\n" },
      ),
    );
  });
});
