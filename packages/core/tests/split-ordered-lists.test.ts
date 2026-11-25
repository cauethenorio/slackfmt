import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const convertMarkdown = (markdown: string) => convert(markdown, { format: "markdown" });
const ordered = { insert: "\n", attributes: { list: "ordered" } };
const code = { insert: "\n", attributes: { "code-block": true } };
const quote = { insert: "\n", attributes: { blockquote: true } };

describe("an ordered list split by a block a Slack list can't hold", () => {
  it("keeps its count after a code block, as numbered text", async () => {
    expect(await convertMarkdown("1. one\n   ```sh\n   cmd\n   ```\n2. two\n3. three")).toBe(
      delta({ insert: "one" }, ordered, { insert: "cmd" }, code, { insert: "2. two\n3. three\n" }),
    );
  });

  it("keeps its count over several code blocks", async () => {
    expect(
      await convertMarkdown("1. one\n   ```\n   a\n   ```\n2. two\n   ```\n   b\n   ```\n3. three"),
    ).toBe(
      delta({ insert: "one" }, ordered, { insert: "a" }, code, { insert: "2. two\nb" }, code, {
        insert: "3. three\n",
      }),
    );
  });

  it("keeps its count after a quote", async () => {
    expect(await convertMarkdown("1. one\n   > said\n2. two")).toBe(
      delta({ insert: "one" }, ordered, { insert: "said" }, quote, { insert: "2. two\n" }),
    );
  });

  it("keeps its count after a code block in a list inside an item", async () => {
    expect(await convertMarkdown("1. one\n   - inner\n     ```\n     a\n     ```\n2. two")).toBe(
      delta(
        { insert: "one" },
        ordered,
        { insert: "inner" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "a" },
        code,
        { insert: "2. two\n" },
      ),
    );
  });

  it("keeps the items before the split as a list", async () => {
    expect(await convertMarkdown("1. one\n2. two\n   ```\n   a\n   ```\n3. three")).toBe(
      delta({ insert: "one" }, ordered, { insert: "two" }, ordered, { insert: "a" }, code, {
        insert: "3. three\n",
      }),
    );
  });

  it("keeps a list that nothing splits", async () => {
    expect(await convertMarkdown("1. one\n   - inner\n2. two\n\n   more\n3. three")).toBe(
      delta(
        { insert: "one" },
        ordered,
        { insert: "inner" },
        { insert: "\n", attributes: { list: "bullet", indent: 1 } },
        { insert: "two" },
        ordered,
        { insert: "more" },
        ordered,
        { insert: "three" },
        ordered,
      ),
    );
  });

  it("keeps its numbers inside a quote", async () => {
    expect(await convertMarkdown("> 1. one\n>    ```\n>    a\n>    ```\n> 2. two")).toContain(
      JSON.stringify([{ insert: "2. two" }, quote]).slice(1, -1),
    );
  });

  it("leaves a bulleted list alone", async () => {
    expect(await convertMarkdown("- one\n  ```\n  a\n  ```\n- two")).toBe(
      delta(
        { insert: "one" },
        { insert: "\n", attributes: { list: "bullet" } },
        { insert: "a" },
        code,
        { insert: "two" },
        { insert: "\n", attributes: { list: "bullet" } },
      ),
    );
  });
});
