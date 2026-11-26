import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const openThenDone = delta(
  { insert: "☐ open" },
  { insert: "\n", attributes: { list: "bullet" } },
  { insert: "☑ done" },
  { insert: "\n", attributes: { list: "bullet" } },
);

describe("task lists", () => {
  it("puts an open or done box before the item's text", async () => {
    const result = await convert("- [ ] open\n- [x] done", { format: "markdown" });
    expect(result).toBe(openThenDone);
  });

  it("leaves the other items of the list alone", async () => {
    const result = await convert("- plain\n- [ ] open", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "plain" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "☐ open" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });

  it("keeps the box out of the item's formatting", async () => {
    const result = await convert("- [x] **done**", { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "☑ " },
        { insert: "done", attributes: { bold: true } },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });

  it("reads HTML checkboxes as GitHub renders them", async () => {
    const result = await convert(
      '<ul><li><input type="checkbox" disabled> open</li><li><input type="checkbox" checked disabled> done</li></ul>',
      { format: "html" },
    );
    expect(result).toBe(openThenDone);
  });

  it("reads HTML checkboxes with no space before the text", async () => {
    const result = await convert(
      '<ul><li><input type="checkbox">open</li><li><input type="checkbox" checked>done</li></ul>',
      { format: "html" },
    );
    expect(result).toBe(openThenDone);
  });

  it("reads HTML checkboxes inside an item's paragraph or label", async () => {
    const result = await convert(
      '<ul><li><p><input type="checkbox"> open</p></li><li><label><input type="checkbox" checked> done</label></li></ul>',
      { format: "html" },
    );
    expect(result).toBe(openThenDone);
  });

  it("leaves a checkbox outside a list alone", async () => {
    const result = await convert('<p><input type="checkbox"> not a task</p>', { format: "html" });
    expect(result).toBe(delta({ insert: "not a task\n" }));
  });
});
