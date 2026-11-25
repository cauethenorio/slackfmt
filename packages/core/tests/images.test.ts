import { describe, expect, it } from "vitest";
import { convert } from "../src/pipeline.js";

function delta(...ops: Array<{ insert: string; attributes?: Record<string, unknown> }>): string {
  return JSON.stringify({ ops });
}

const cover = "https://example.com/cover.png";

describe("images", () => {
  it("turns an image with alt text into its alt text, linked to the image", async () => {
    const result = await convert(`![team cover](${cover})`, { format: "markdown" });
    expect(result).toBe(
      delta({ insert: "team cover", attributes: { link: cover } }, { insert: "\n" }),
    );
  });

  it("turns an image without alt text into its URL, linked to the image", async () => {
    const result = await convert(`![](${cover})`, { format: "markdown" });
    expect(result).toBe(delta({ insert: cover, attributes: { link: cover } }, { insert: "\n" }));
  });

  it("turns HTML images into links", async () => {
    const result = await convert(`<p><img src="${cover}" alt="team cover"></p>`, {
      format: "html",
    });
    expect(result).toBe(
      delta({ insert: "team cover", attributes: { link: cover } }, { insert: "\n" }),
    );
    const noAlt = await convert(`<p><img src="${cover}" alt=""></p>`, { format: "html" });
    expect(noAlt).toBe(delta({ insert: cover, attributes: { link: cover } }, { insert: "\n" }));
  });

  it("links an image inside a link to the image", async () => {
    const result = await convert(`[![team cover](${cover})](https://example.com)`, {
      format: "markdown",
    });
    expect(result).toBe(
      delta({ insert: "team cover", attributes: { link: cover } }, { insert: "\n" }),
    );
  });

  it("keeps the text around an image", async () => {
    const result = await convert(`before ![team cover](${cover}) after`, { format: "markdown" });
    expect(result).toBe(
      delta(
        { insert: "before " },
        { insert: "team cover", attributes: { link: cover } },
        { insert: " after\n" },
      ),
    );
  });

  it("finds the URL of an image written as a reference", async () => {
    const result = await convert(`![team cover][cover]\n\n[cover]: ${cover}`, {
      format: "markdown",
    });
    expect(result).toContain(JSON.stringify({ insert: "team cover", attributes: { link: cover } }));
  });
});
