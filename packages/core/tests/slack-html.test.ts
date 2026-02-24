import { describe, expect, it } from "vitest";
import { slackHtmlToMarkdown } from "../src/parsers/slack-html.js";

const S =
  '<span aria-label="\u00a0" class="c-mrkdwn__br" data-stringify-type="paragraph-break"></span>';
const M = '<meta charset="utf-8">';
const sec = (inner: string) => `<div class="p-rich_text_section">${inner}</div>`;

describe("slackHtmlToMarkdown", () => {
  it("converts bold", () => {
    expect(slackHtmlToMarkdown(`${M}${sec(`<b data-stringify-type="bold">hello</b>${S}`)}`)).toBe(
      "**hello**",
    );
  });

  it("converts italic", () => {
    expect(slackHtmlToMarkdown(`${M}${sec(`<i data-stringify-type="italic">hello</i>${S}`)}`)).toBe(
      "*hello*",
    );
  });

  it("converts strikethrough", () => {
    expect(slackHtmlToMarkdown(`${M}${sec(`<s data-stringify-type="strike">hello</s>${S}`)}`)).toBe(
      "~~hello~~",
    );
  });

  it("converts inline code", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`<code data-stringify-type="code" class="c-mrkdwn__code">code</code>${S}`)}`,
      ),
    ).toBe("`code`");
  });

  it("converts a link", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`<a target="_blank" class="c-link c-link--underline" data-stringify-link="https://example.com" url="https://example.com" href="https://example.com" rel="noopener noreferrer">click</a>${S}`)}`,
      ),
    ).toBe("[click](https://example.com)");
  });

  it("converts unordered list", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}<ul data-stringify-type="unordered-list" data-list-tree="true" class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested" data-indent="0" data-border="0"><li data-stringify-indent="0" data-stringify-border="0">item 1</li><li data-stringify-indent="0" data-stringify-border="0">item 2</li></ul>`,
      ),
    ).toBe("- item 1\n- item 2");
  });

  it("converts ordered list", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}<ol data-stringify-type="ordered-list" data-list-tree="true" class="p-rich_text_list p-rich_text_list__ordered p-rich_text_list--nested" data-indent="0" data-border="0"><li data-stringify-indent="0" data-stringify-border="0">first</li><li data-stringify-indent="0" data-stringify-border="0">second</li></ol>`,
      ),
    ).toBe("1. first\n2. second");
  });

  it("converts nested list", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}<ul data-stringify-type="unordered-list" data-list-tree="true" class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested" data-indent="0" data-border="0"><li data-stringify-indent="0" data-stringify-border="0">parent<ul data-stringify-type="unordered-list" data-list-tree="true" class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested" data-indent="1" data-border="0"><li data-stringify-indent="1" data-stringify-border="0">child</li></ul></li></ul>`,
      ),
    ).toBe("- parent\n  - child");
  });

  it("converts code block", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}<pre data-stringify-type="pre" class="p-rich_text_block">const x = 1;\n</pre>`,
      ),
    ).toBe("```\nconst x = 1;\n```");
  });

  it("converts blockquote", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}<blockquote data-stringify-type="quote">\n<div data-slack-paragraph="true">quoted text</div>\n</blockquote>`,
      ),
    ).toBe("> quoted text");
  });

  it("converts paragraph-break to blank line", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`<b data-stringify-type="bold"># MongoDB Version Reaching End-of-Life</b>${S}`)}${sec(`Wobo is currently using MongoDB version 6.${S}`)}`,
      ),
    ).toBe(
      "**# MongoDB Version Reaching End-of-Life**\n\nWobo is currently using MongoDB version 6.",
    );
  });

  it("converts combined formatting", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`<b data-stringify-type="bold">bold</b> and <i data-stringify-type="italic">italic</i>${S}`)}`,
      ),
    ).toBe("**bold** and *italic*");
  });

  it("converts emoji image to shortcode", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`hello <span class="c-emoji c-emoji__medium c-emoji--inline"><img src="https://emoji.slack-edge.com/img.png" alt=":wave:" data-stringify-type="emoji" data-stringify-emoji=":wave:"></span>${S}`)}`,
      ),
    ).toBe("hello :wave:");
  });

  it("converts bold wrapping emoji without extra asterisks", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec(`<b data-stringify-type="bold">Title </b><b data-stringify-type="bold"><span class="c-emoji"><img alt=":zap:" data-stringify-type="emoji" data-stringify-emoji=":zap:"></span></b>${S}`)}`,
      ),
    ).toBe("**Title ****:zap:**");
  });

  it("converts section with br before list", () => {
    expect(
      slackHtmlToMarkdown(
        `${M}${sec('<b data-stringify-type="bold">Title:</b><br aria-hidden="true">')}<ul data-stringify-type="unordered-list" data-list-tree="true" class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested" data-indent="0" data-border="0"><li data-stringify-indent="0" data-stringify-border="0">item 1</li></ul>`,
      ),
    ).toBe("**Title:**\n- item 1");
  });
});
