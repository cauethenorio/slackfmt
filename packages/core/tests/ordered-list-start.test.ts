import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

describe("ordered lists that start past 1", () => {
  it("numbers the items as text, counting up from the start", async () => {
    const result = await convert("3. third\n4. fourth", { format: "markdown" });
    expect(result).toBe(delta({ insert: "3. third\n4. fourth\n" }));
  });

  it("counts up whatever the later markers say", async () => {
    const result = await convert("3. third\n3. fourth\n3. fifth", { format: "markdown" });
    expect(result).toBe(delta({ insert: "3. third\n4. fourth\n5. fifth\n" }));
  });

  it("numbers an HTML list from its start", async () => {
    const result = await convert('<ol start="3"><li>third</li><li>fourth</li></ol>', {
      format: "html",
    });
    expect(result).toBe(delta({ insert: "3. third\n4. fourth\n" }));
  });

  it("keeps a list from 1 as a list", async () => {
    const result = await convert("1. first\n2. second", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "first" },
        { insert: "\n", attributes: { list: "ordered" } },
        { insert: "second" },
        { insert: "\n", attributes: { list: "ordered" } },
      ),
    );
  });

  it("numbers a list from 0 as text", async () => {
    const result = await convert("0. zeroth\n1. first", { format: "markdown" });
    expect(result).toBe(delta({ insert: "0. zeroth\n1. first\n" }));
  });

  it("keeps the number out of the item's formatting", async () => {
    const result = await convert("3. **third**", { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "3. " }, { insert: "third", attributes: { bold: true } }, { insert: "\n" }),
    );
  });

  it("numbers an item that opens with something other than a paragraph", async () => {
    const result = await convert("3. ```\n   code\n   ```", { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "3. \ncode" }, { insert: "\n", attributes: { "code-block": true } }),
    );
  });

  it("numbers an empty item", async () => {
    const result = await convert("3. third\n4.\n5. fifth", { format: "markdown" });
    expect(result).toBe(delta({ insert: "3. third\n4. \n5. fifth\n" }));
  });

  it("numbers only an item's first paragraph", async () => {
    const result = await convert("3. third\n\n   more of it", { format: "markdown" });
    expect(result).toBe(delta({ insert: "3. third\nmore of it\n" }));
  });

  it("keeps a list nested in a numbered item", async () => {
    const result = await convert("3. third\n   - nested\n4. fourth", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "3. third\nnested" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "4. fourth\n" },
      ),
    );
  });

  it("keeps the numbers inside a quote", async () => {
    const result = await convert("> 3. third\n> 4. fourth", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "3. third" },
        { insert: "\n", attributes: { blockquote: true } },
        { insert: "4. fourth" },
        { insert: "\n", attributes: { blockquote: true } },
      ),
    );
  });
});
