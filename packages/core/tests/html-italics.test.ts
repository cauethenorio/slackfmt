import { describe, expect, it } from "vitest";
import { htmlToMarkdown } from "../src/parsers/html.js";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("HTML italics", () => {
  it("writes them with an asterisk", () => {
    expect(htmlToMarkdown("<em>hello</em>")).toBe("*hello*");
  });

  it("keeps italics inside a word", async () => {
    const result = await convert("<p>un<em>believ</em>able</p>", { format: "html" });
    expect(result).toBe(
      delta(
        { insert: "un" },
        { insert: "believ", attributes: { italic: true } },
        { insert: "able\n" },
      ),
    );
  });

  it("keeps italics at a word's end and start", async () => {
    const result = await convert("<p>snow<i>fall</i>, <i>rain</i>fall</p>", { format: "html" });
    expect(result).toBe(
      delta(
        { insert: "snow" },
        { insert: "fall", attributes: { italic: true } },
        { insert: ", " },
        { insert: "rain", attributes: { italic: true } },
        { insert: "fall\n" },
      ),
    );
  });

  it("keeps bold italics inside a word", async () => {
    const result = await convert("<p>un<strong><em>believ</em></strong>able</p>", {
      format: "html",
    });
    expect(result).toBe(
      delta(
        { insert: "un" },
        { insert: "believ", attributes: { italic: true, bold: true } },
        { insert: "able\n" },
      ),
    );
  });
});
