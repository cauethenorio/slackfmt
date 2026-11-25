import { describe, expect, it } from "vitest";
import { markCssMarks } from "../src/parsers/css-marks.js";
import { htmlToMarkdown } from "../src/parsers/html.js";
import { convert } from "../src/pipeline.js";

type Op = { insert: string; attributes?: Record<string, unknown> };

async function ops(html: string): Promise<Op[]> {
  return JSON.parse(await convert(html, { format: "html" })).ops;
}

const bold = { bold: true };
const italic = { italic: true };
const strike = { strike: true };

describe("marks set in CSS", () => {
  it("keeps a Google Docs copy's marks, and adds none for its wrapper", async () => {
    const html = [
      '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1">',
      '<p dir="ltr" style="line-height:1.38;"><span style="font-weight:700;font-style:normal;text-decoration:none;">Bold</span>',
      '<span style="font-weight:400;"> and </span>',
      '<span style="font-weight:400;font-style:italic;">italic</span>',
      '<span style="font-weight:400;"> and </span>',
      '<span style="font-weight:400;text-decoration:line-through;">struck</span></p>',
      '<ul><li dir="ltr" style="font-weight:400;"><p dir="ltr"><span style="font-weight:400;">one</span></p></li></ul>',
      '</b><br class="Apple-interchange-newline">',
    ].join("");
    expect(await ops(html)).toEqual([
      { insert: "Bold", attributes: bold },
      { insert: " and " },
      { insert: "italic", attributes: italic },
      { insert: " and " },
      { insert: "struck", attributes: strike },
      { insert: "\n\none" },
      { insert: "\n", attributes: { list: "bullet" } },
    ]);
  });

  for (const weight of ["bold", "bolder", "600", "700", "900"]) {
    it(`takes font-weight ${weight} as bold`, async () => {
      expect(await ops(`<p>a <span style="font-weight: ${weight}">b</span></p>`)).toEqual([
        { insert: "a " },
        { insert: "b", attributes: bold },
        { insert: "\n" },
      ]);
    });
  }

  for (const weight of ["normal", "lighter", "400", "500"]) {
    it(`adds no bold for font-weight ${weight}`, async () => {
      expect(await ops(`<p>a <span style="font-weight: ${weight}">b</span></p>`)).toEqual([
        { insert: "a b\n" },
      ]);
      expect(await ops(`<p>a <b style="font-weight: ${weight}">b</b></p>`)).toEqual([
        { insert: "a b\n" },
      ]);
      expect(await ops(`<p>a <strong style="font-weight: ${weight}">b</strong></p>`)).toEqual([
        { insert: "a b\n" },
      ]);
    });
  }

  it("takes several marks from one style", async () => {
    expect(
      await ops(
        '<p><span style="font-weight:700;font-style:italic;text-decoration:underline line-through">all</span></p>',
      ),
    ).toEqual([
      { insert: "all", attributes: { bold: true, italic: true, strike: true } },
      { insert: "\n" },
    ]);
  });

  it("reads text-decoration-line", async () => {
    expect(
      await ops('<p><span style="text-decoration-line: line-through">struck</span></p>'),
    ).toEqual([{ insert: "struck", attributes: strike }, { insert: "\n" }]);
  });

  it("marks the text of a styled block, and not its neighbours", async () => {
    expect(
      await ops('<div style="font-weight:bold"><p>one</p><p>two</p></div><p>three</p>'),
    ).toEqual([
      { insert: "one", attributes: bold },
      { insert: "\n\n" },
      { insert: "two", attributes: bold },
      { insert: "\n\nthree\n" },
    ]);
    expect(
      await ops('<ul><li style="font-weight:bold">one<ul><li>two</li></ul></li></ul>'),
    ).toEqual([
      { insert: "one", attributes: bold },
      { insert: "\n", attributes: { list: "bullet" } },
      { insert: "two", attributes: bold },
      { insert: "\n", attributes: { list: "bullet", indent: 1 } },
    ]);
  });

  it("leaves out of a bold block what's styled normal", async () => {
    expect(
      await ops('<p style="font-weight:700">bold <span style="font-weight:400">plain</span></p>'),
    ).toEqual([{ insert: "bold", attributes: bold }, { insert: " plain\n" }]);
  });

  it("keeps a link's own link", async () => {
    expect(
      await ops('<p><a href="https://example.com" style="font-weight:700">click</a></p>'),
    ).toEqual([
      { insert: "click", attributes: { bold: true, link: "https://example.com" } },
      { insert: "\n" },
    ]);
  });

  it("doesn't mark twice what a tag marks already", async () => {
    expect(await ops('<p><strong><span style="font-weight:700">bold</span></strong></p>')).toEqual([
      { insert: "bold", attributes: bold },
      { insert: "\n" },
    ]);
    expect(await ops('<p><b style="font-weight:700">bold</b></p>')).toEqual([
      { insert: "bold", attributes: bold },
      { insert: "\n" },
    ]);
  });

  it("marks neighbours with different marks", async () => {
    expect(
      await ops(
        '<p><span style="font-weight:700">one</span><span style="font-weight:700;font-style:italic">two</span><span style="font-style:italic">three</span></p>',
      ),
    ).toEqual([
      { insert: "one", attributes: bold },
      { insert: "two", attributes: { bold: true, italic: true } },
      { insert: "three", attributes: italic },
      { insert: "\n" },
    ]);
  });

  it("writes one pair of markers where a tag marks inside a style that marks", () => {
    expect(htmlToMarkdown('<p><span style="font-weight:700">a <b>b</b> c</span></p>')).toBe(
      "**a b c**",
    );
    expect(htmlToMarkdown('<div style="font-style:italic"><p><em>a</em> b</p></div>')).toMatch(
      /^([*_])a b\1$/,
    );
  });

  for (const text of ["~draft", "draft~", "~draft~", "~/notes"]) {
    it(`keeps a tilde at the edge of struck text (${text})`, async () => {
      expect(await ops(`<p><span style="text-decoration:line-through">${text}</span></p>`)).toEqual(
        [{ insert: text, attributes: strike }, { insert: "\n" }],
      );
      expect(
        await ops(
          `<p>see <span style="text-decoration:line-through">${text}</span> and <s style="font-weight:700">x</s></p>`,
        ),
      ).toEqual(expect.arrayContaining([{ insert: text, attributes: strike }]));
    });
  }

  it("keeps a break at the edge of marked text", () => {
    expect(htmlToMarkdown('<p><span style="font-weight:700">Title<br></span>body</p>')).toBe(
      "**Title**  \nbody",
    );
    expect(htmlToMarkdown('<p>x<span style="font-weight:700"><br>Title</span></p>')).toBe(
      "x  \n**Title**",
    );
  });

  for (const [style, mark] of [
    ["font-weight:700", bold],
    ["font-style:italic", italic],
    ["text-decoration:line-through", strike],
  ] as const) {
    it(`marks both sides of a blank line (${style})`, async () => {
      expect(await ops(`<p><span style="${style}">a<br><br>b</span></p>`)).toEqual([
        { insert: "a", attributes: mark },
        { insert: "\n\n" },
        { insert: "b", attributes: mark },
        { insert: "\n" },
      ]);
    });
  }

  for (const value of ["inherit", "unset"]) {
    it(`keeps a mark its style ${value}s`, async () => {
      expect(
        await ops(
          `<p style="font-weight:700;font-style:italic">a <span style="font-weight:${value};font-style:${value}">b</span></p>`,
        ),
      ).toEqual([{ insert: "a b", attributes: { bold: true, italic: true } }, { insert: "\n" }]);
    });
  }

  it("leaves a checkbox out of the mark around it", () => {
    expect(
      markCssMarks(
        '<ul><li style="font-weight:700"><input type="checkbox" checked> done</li></ul>',
      ),
    ).toContain('checked><span data-marks="bold"> done</span>');
  });

  it("marks punctuation beside a word, inside a tag that marks too", async () => {
    expect(
      await ops('<p>was<b><span style="text-decoration:line-through">(old)</span></b> new</p>'),
    ).toEqual([
      { insert: "was" },
      { insert: "(old)", attributes: { bold: true, strike: true } },
      { insert: " new\n" },
    ]);
  });

  it("adds no marks inside code", async () => {
    expect(await ops('<p>run <code><span style="font-weight:700">it</span></code></p>')).toEqual([
      { insert: "run " },
      { insert: "it", attributes: { code: true } },
      { insert: "\n" },
    ]);
  });
});
