import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("HTML's head text", () => {
  it("leaves out a Word-style copy's title and stylesheet", async () => {
    const result = await convert(
      [
        "<html><head><meta charset=utf-8><title>Doc title</title>",
        "<style>p.MsoNormal{margin:0in}</style></head>",
        "<body><p class=MsoNormal>Text</p></body></html>",
      ].join("\n"),
      { format: "html" },
    );
    expect(result).toBe(delta({ insert: "Text\n" }));
  });

  for (const tag of ["style", "script", "title"]) {
    it(`leaves out <${tag}> beside the text`, async () => {
      const result = await convert(`<p>before</p><${tag}>hidden</${tag}><p>after</p>`, {
        format: "html",
      });
      expect(result).toBe(delta({ insert: "before\n\nafter\n" }));
    });
  }

  it("leaves out a head's own text", async () => {
    const result = await convert("<head><title>hidden</title></head><p>kept</p>", {
      format: "html",
    });
    expect(result).toBe(delta({ insert: "kept\n" }));
  });
});
