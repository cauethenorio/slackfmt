import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const convertMarkdown = (markdown: string) => convert(markdown, { format: "markdown" });

describe("a raw HTML block in Markdown", () => {
  it("keeps its text as plain paragraphs", async () => {
    expect(
      await convertMarkdown("before\n\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n\nafter"),
    ).toBe(delta({ insert: "before\n\none\n\ntwo\n\nafter\n" }));
  });

  it("keeps the text of one that ends a paragraph", async () => {
    expect(await convertMarkdown("before\n<div>inside <b>it</b></div>\n\nafter")).toBe(
      delta({ insert: "before\n\ninside it\n\nafter\n" }),
    );
  });

  it("keeps a details block's summary and its Markdown", async () => {
    expect(
      await convertMarkdown(
        "<details>\n<summary>Summary</summary>\n\nSome **bold** text\n\n</details>",
      ),
    ).toBe(
      delta(
        { insert: "Summary\n\nSome " },
        { insert: "bold", attributes: { bold: true } },
        { insert: " text\n" },
      ),
    );
  });

  it("keeps its characters as text, not as Markdown", async () => {
    expect(await convertMarkdown("<p>2 * 3 &lt; 7 &amp; _so_ on</p>")).toBe(
      delta({ insert: "2 * 3 < 7 & _so_ on\n" }),
    );
  });

  it("emits nothing for a block that holds no text", async () => {
    expect(await convertMarkdown("before\n\n<!-- a comment -->\n\n<hr>\n\nafter")).toBe(
      delta({ insert: "before\n\nafter\n" }),
    );
    expect(await convertMarkdown("<style>p{}</style>\n\nafter")).toBe(delta({ insert: "after\n" }));
  });

  it("keeps a quoted block's text in the quote, and a list item's in its item", async () => {
    expect(await convertMarkdown("> <div>inside</div>")).toBe(
      delta({ insert: "inside" }, { insert: "\n", attributes: { blockquote: true } }),
    );
    expect(await convertMarkdown("- <div>inside</div>")).toBe(
      delta({ insert: "inside" }, { insert: "\n", attributes: { list: "bullet" } }),
    );
  });

  it("keeps a footnote's text", async () => {
    expect(await convertMarkdown("a[^1]\n\n[^1]: <div>inside</div>")).toBe(
      delta({ insert: "a\n\ninside\n" }),
    );
  });

  it("leaves inline tags as they were: dropped, with their text kept", async () => {
    expect(await convertMarkdown("press <kbd>Cmd</kbd> now")).toBe(
      delta({ insert: "press Cmd now\n" }),
    );
  });
});
