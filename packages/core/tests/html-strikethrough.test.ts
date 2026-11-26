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

  it("strikes text that starts or ends with a tilde", async () => {
    const result = await convert("<p><s>~/Development</s> is gone</p><p>next <s>one~</s></p>", {
      format: "html",
    });
    expect(result).toBe(
      delta(
        { insert: "~/Development", attributes: { strike: true } },
        { insert: " is gone\n\nnext " },
        { insert: "one~", attributes: { strike: true } },
        { insert: "\n" },
      ),
    );
  });

  it("strikes text struck twice once", async () => {
    const result = await convert("<p><s><del>struck</del> too</s></p>", { format: "html" });
    expect(result).toBe(
      delta({ insert: "struck too", attributes: { strike: true } }, { insert: "\n" }),
    );
  });

  it("strikes neighbouring struck text as one run", async () => {
    const result = await convert("<p><s>one</s><del>two</del><strike>three</strike></p>", {
      format: "html",
    });
    expect(result).toBe(
      delta({ insert: "onetwothree", attributes: { strike: true } }, { insert: "\n" }),
    );
  });

  it("keeps a line break at a struck text's end outside it", async () => {
    const result = await convert("<p><s>struck<br></s>kept</p>", { format: "html" });
    expect(result).toContain(JSON.stringify({ insert: "struck", attributes: { strike: true } }));
    expect(result).not.toContain("~");
  });

  it("strikes each paragraph of a struck block", async () => {
    const result = await convert("<del><p>one</p><p>two</p></del>", { format: "html" });
    expect(result).toBe(
      delta(
        { insert: "one", attributes: { strike: true } },
        { insert: "\n\n" },
        { insert: "two", attributes: { strike: true } },
        { insert: "\n" },
      ),
    );
  });

  it("leaves code's own tildes alone", async () => {
    const result = await convert("<p><s><code>~a</code></s></p>", { format: "html" });
    expect(result).toBe(
      delta({ insert: "~a", attributes: { strike: true, code: true } }, { insert: "\n" }),
    );
  });

  for (const [html, before, text, after] of [
    ["<p><del>Done.</del>Next</p>", "", "Done.", "Next\n"],
    ["<p>was<del>(old)</del>new</p>", "was", "(old)", "new\n"],
    ["<p>was<b><del>(old)</del></b> new</p>", "was", "(old)", " new\n"],
  ]) {
    it(`strikes punctuation beside a word (${html})`, async () => {
      const { ops } = JSON.parse(await convert(html, { format: "html" }));
      expect(ops.map((op: { insert: string }) => op.insert).join("|")).toBe(
        [before, text, after].filter(Boolean).join("|"),
      );
      expect(ops.find((op: { insert: string }) => op.insert === text).attributes).toMatchObject({
        strike: true,
      });
    });
  }

  it("strikes text inside other marks, beside a word", async () => {
    const result = await convert("<p><del><b>old</b></del>new</p>", { format: "html" });
    expect(result).toBe(
      delta({ insert: "old", attributes: { strike: true, bold: true } }, { insert: "new\n" }),
    );
  });

  it("strikes text before a struck space", async () => {
    const result = await convert("<p><del>a</del><del> </del>b</p>", { format: "html" });
    expect(result).toBe(delta({ insert: "a", attributes: { strike: true } }, { insert: " b\n" }));
  });
});
