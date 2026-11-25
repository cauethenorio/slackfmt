import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

describe("a Delta given as its ops array alone", () => {
  it("converts as the Delta that holds it", async () => {
    const ops = [
      { insert: "item" },
      { insert: "\n", attributes: { list: "bullet" } },
      { insert: "hello", attributes: { bold: true } },
      { insert: "\n" },
    ];
    const whole = await convert(JSON.stringify({ ops }), { format: "quill-delta" });
    expect(await convert(JSON.stringify(ops), { format: "quill-delta" })).toBe(whole);
  });
});
