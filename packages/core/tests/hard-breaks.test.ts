import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("hard breaks", () => {
  it("keeps a backslash hard break as a line break", async () => {
    const result = await convert("first line\\\nsecond line", { format: "markdown" });
    expect(result).toBe(delta({ insert: "first line\nsecond line\n" }));
  });

  it("keeps a two-space hard break as a line break", async () => {
    const result = await convert("first line  \nsecond line", { format: "markdown" });
    expect(result).toBe(delta({ insert: "first line\nsecond line\n" }));
  });

  it("keeps an HTML <br> as a line break", async () => {
    const result = await convert("<p>first line<br>second line</p>", { format: "html" });
    expect(result).toBe(delta({ insert: "first line\nsecond line\n" }));
  });

  it("breaks between formatted text", async () => {
    const result = await convert("**bold**\\\n_italic_", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "bold", attributes: { bold: true } },
        { insert: "\n" },
        { insert: "italic", attributes: { italic: true } },
        { insert: "\n" },
      ),
    );
  });

  it("keeps both lines of a quote inside the quote", async () => {
    const result = await convert("> first line\\\n> second line", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "first line" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "second line" },
        { insert: "\n", attributes: { blockquote: true } },
      ),
    );
  });
});
