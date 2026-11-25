import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/parsers/html.js";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("a plain <pre>", () => {
  it("keeps the text around it", async () => {
    const result = await convert("<p>intro</p><pre>one\n  two</pre><p>after</p>", {
      format: "html",
    });
    expect(result).toBe(
      delta(
        { insert: "intro\n\none" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "  two" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "\nafter\n" },
      ),
    );
  });

  it("keeps the text around a syntax-highlighted one", async () => {
    const result = await convert(
      '<p>intro</p><pre><span style="color:#cf222e">const</span> x = 1;<br>x;</pre><p>after</p>',
      { format: "html" },
    );
    expect(result).toBe(
      delta(
        { insert: "intro\n\nconst x = 1;" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "x;" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "\nafter\n" },
      ),
    );
  });

  it("keeps every one of several", async () => {
    const result = await convert("<pre>one</pre><pre>two</pre>", { format: "html" });
    expect(result).toBe(
      delta(
        { insert: "one" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "\ntwo" },
        { insert: "\n", attributes: { "code-block": true } },
      ),
    );
  });

  it("keeps the text beside a preformatted div", async () => {
    const result = await convert('<div style="white-space: pre-wrap">one</div><p>after</p>', {
      format: "html",
    });
    expect(result).toBe(delta({ insert: "one\n\nafter\n" }));
  });

  it("is still read as source when it holds all of the copy's text", () => {
    expect(
      htmlToMarkdown(
        "<html><head><title>a page</title><style>pre{}</style></head><body>\n<pre># Title\n\n- item</pre>\n</body></html>",
      ),
    ).toBe("# Title\n\n- item");
  });

  it("keeps its characters and fences as written", async () => {
    const result = await convert("<p>intro</p><pre>a*b<br>c_d <b>e</b><br>```</pre>", {
      format: "html",
    });
    expect(result).toBe(
      delta(
        { insert: "intro\n\na*b" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "c_d e" },
        { insert: "\n", attributes: { "code-block": true } },
        { insert: "```" },
        { insert: "\n", attributes: { "code-block": true } },
      ),
    );
  });

  it("keeps an image or a rule beside it", () => {
    expect(
      htmlToMarkdown('<pre>one</pre><p><img src="https://example.com/p.png" alt="pic"></p>'),
    ).toBe("```\none\n```\n\n![pic](https://example.com/p.png)");
    expect(htmlToMarkdown("<pre>one</pre><hr>")).toBe("```\none\n```\n\n* * *");
  });

  it("leaves out the text of a style or script inside it", async () => {
    const result = await convert(
      "<p>intro</p><pre><style>.a{}</style>code<script>run()</script></pre>",
      { format: "html" },
    );
    expect(result).toBe(
      delta({ insert: "intro\n\ncode" }, { insert: "\n", attributes: { "code-block": true } }),
    );
  });
});
