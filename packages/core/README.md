# @slackfmt/core

Convert Markdown, HTML, and other formats to Slack's Quill Delta format — the native rich text format Slack uses internally. The output preserves formatting (bold, italic, code blocks, lists, links, etc.) when pasted into Slack's compose bar.

## Install

```bash
npm install @slackfmt/core
```

## Usage

```typescript
import { convert } from "@slackfmt/core";

// Auto-detect input format — result is Slack-ready Quill Delta JSON
const delta = await convert("**bold** and _italic_");

// Specify format explicitly
const delta = await convert("<b>bold</b>", { format: "html" });
```

## Supported formats

- `markdown` — GitHub-flavored Markdown
- `html` — Generic HTML
- `slack-html` — Slack's clipboard HTML format

## API

### `convert(input, options?)`

Converts input text to Slack Quill Delta JSON string. Auto-detects format unless `options.format` is specified.

### `htmlToMarkdown(html)`

Converts HTML to normalized Markdown.

### `slackHtmlToMarkdown(html)`

Converts Slack's HTML clipboard format to Markdown.

### `quillDeltaToMarkdown(delta)`

Converts Quill Delta JSON to Markdown.

### `markdownToDelta(markdown)`

Converts Markdown to Slack Quill Delta JSON string.

### `normalizeMarkdown(markdown)`

Normalizes Markdown through a parse/serialize round-trip.
