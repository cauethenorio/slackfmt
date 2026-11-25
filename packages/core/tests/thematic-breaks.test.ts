import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const rule = "──────────";

describe("thematic breaks", () => {
  for (const source of ["---", "***"]) {
    it(`turns ${source} into a box rule on its own line`, async () => {
      const result = await convert(`above\n\n${source}\n\nbelow`, { format: "markdown" });
      expect(result).toBe(delta({ insert: `above\n\n${rule}\n\nbelow\n` }));
    });
  }

  it("turns <hr> into a box rule on its own line", async () => {
    const result = await convert("<p>above</p><hr><p>below</p>", { format: "html" });
    expect(result).toBe(delta({ insert: `above\n\n${rule}\n\nbelow\n` }));
  });

  it("carries no block attributes inside a quote", async () => {
    const result = await convert("> above\n>\n> ---\n>\n> below", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "above" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: `${rule}\nbelow` },
        { insert: "\n", attributes: { blockquote: true } },
      ),
    );
  });
});
