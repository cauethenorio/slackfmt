import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("HTML strikethrough", () => {
  for (const tag of ["del", "s", "strike"]) {
    it(`strikes <${tag}>`, async () => {
      const result = await convert(`<p>kept <${tag}>struck</${tag}> kept</p>`, { format: "html" });
      expect(result).toBe(
        delta(
          { insert: "kept " },
          { insert: "struck", attributes: { strike: true } },
          { insert: " kept\n" },
        ),
      );
    });
  }

  it("keeps the spaces at a struck word's edges outside it", async () => {
    const result = await convert("<p>kept<del> struck </del>kept</p>", { format: "html" });
    expect(result).toBe(
      delta(
        { insert: "kept " },
        { insert: "struck", attributes: { strike: true } },
        { insert: " kept\n" },
      ),
    );
  });

  it("strikes bold text", async () => {
    const result = await convert("<p><strong><del>struck</del></strong></p>", { format: "html" });
    expect(result).toBe(
      delta({ insert: "struck", attributes: { bold: true, strike: true } }, { insert: "\n" }),
    );
  });
});
