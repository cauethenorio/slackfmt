# slackfmt

Format Markdown and HTML to paste into Slack with styles preserved.

## CLI

```sh
npm install -g @slackfmt/cli
```

```sh
echo "**bold**" | slackfmt -f markdown
cat doc.md | slackfmt
slackfmt -f html < page.html
```

By default, `slackfmt` copies the result to your clipboard ready to paste into Slack. Use `--stdout` to print to stdout instead.

### Supported formats

- `markdown` — Markdown (default, auto-detected)
- `html` — HTML
- `slack-html` — Slack's internal HTML format
- `quill-delta` — Quill Delta JSON

## Web

A web interface is also available in `packages/web`.

## Packages

| Package | Description |
|---|---|
| [@slackfmt/core](packages/core) | Conversion engine |
| [@slackfmt/cli](packages/cli) | Command-line interface |
| [@slackfmt/clipboard](packages/clipboard) | Native clipboard integration (Rust) |
| [@slackfmt/web](packages/web) | Web interface |
