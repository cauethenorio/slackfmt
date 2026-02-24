# @slackfmt/cli

CLI tool to convert text and copy it to your clipboard as Slack-ready rich text.

Reads from stdin, converts to Slack's native Quill Delta format, and writes it to your clipboard. When you paste into Slack's compose bar, all formatting (bold, italic, code blocks, lists, links, etc.) is preserved.

## Install

```bash
npm install -g @slackfmt/cli
```

## Usage

```bash
echo "**bold**" | slackfmt -f markdown
cat doc.md | slackfmt
slackfmt -f html < page.html
```

## Options

```
--format, -f   Input format: markdown, html, slack-html (default: auto-detect)
--stdout       Output Quill Delta JSON to stdout instead of clipboard
--help         Show help
```
