# slackfmt

Format Markdown and HTML to paste into Slack with styles preserved.

Slack handles simple formatting when you paste, but anything beyond that breaks — nested lists get flattened, links lose their labels, and code blocks fall apart. slackfmt converts your content to Slack's native rich text format so everything pastes correctly.

## Usage

### CLI

```sh
echo "**bold** and _italic_" | npx @slackfmt/cli@latest
cat doc.md | npx @slackfmt/cli@latest
npx @slackfmt/cli@latest -f html < page.html
```

By default, `slackfmt` copies the result to your clipboard ready to paste into Slack. Use `--stdout` to print to stdout instead.

Supported input formats (`-f` flag): `markdown` (default, auto-detected), `html`, `slack-html`, `quill-delta`.

### AI Skill

Add slackfmt as a skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or other AI agents:

```sh
npx skills add https://github.com/cauethenorio/slackfmt --skill slackfmt
```

Once installed, just ask your agent to format something for Slack — it will compose the markdown content, pipe it through `npx @slackfmt/cli@latest`, and copy the result to your clipboard ready to paste.

### Web

Try it in the browser at [slackfmt.labs.caue.dev](https://slackfmt.labs.caue.dev).

## How it works

Slack uses [Quill Delta](https://quilljs.com/docs/delta/) JSON as its compose bar internal rich text format. When you paste into Slack, it looks for a `slack/texty` entry inside a Chromium custom MIME type (`org.chromium.web-custom-data`) on the clipboard.

**slackfmt** exploits this by:

1. Converting your input (Markdown, HTML, etc.) to Quill Delta JSON
2. Encoding the Delta as a [Chromium Pickle](https://source.chromium.org/chromium/chromium/src/+/main:base/pickle.h) binary blob with the `slack/texty` MIME type
3. Writing it to the system clipboard via a native Rust addon

When you paste, Slack reads the custom data and applies the formatting natively — bold, italic, nested lists, code blocks, links, and blockquotes all come through intact.

## Packages

| Package                                   | Description                         |
| ----------------------------------------- | ----------------------------------- |
| [@slackfmt/core](packages/core)           | Conversion engine                   |
| [@slackfmt/cli](packages/cli)             | Command-line interface              |
| [@slackfmt/clipboard](packages/clipboard) | Native clipboard integration (Rust) |
| [@slackfmt/web](packages/web)             | Web interface                       |
