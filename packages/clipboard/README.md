# @slackfmt/clipboard

Native Node.js addon for reading and writing Slack-formatted content to the system clipboard. Built with Rust using [napi-rs](https://napi.rs) and [clipboard-rs](https://github.com/ChurchTao/clipboard-rs).

## API

```typescript
writeClipboard(plainText: string, deltaText: string): void
readClipboard(): { plainText?: string, deltaText?: string }
```

- `writeClipboard` writes plain text and Slack Quill Delta JSON to the clipboard.
- `readClipboard` reads both back.

The delta text is stored in a format that Slack's desktop app (Electron) can read natively as rich text.

## How it works: `org.chromium.web-custom-data`

### The problem

When Slack's web app copies rich text, it calls:

```javascript
clipboardData.setData("slack/texty", deltaJson);
```

`slack/texty` is a custom MIME type. The browser's Clipboard API only maps standard types (`text/plain`, `text/html`) directly to OS clipboard entries. For non-standard MIME types like `slack/texty`, Chromium bundles them into a single binary blob and writes it to the OS clipboard under the type `org.chromium.web-custom-data`.

### The OS clipboard is flexible

Operating systems accept arbitrary clipboard type identifiers:

- **macOS**: `NSPasteboard` accepts any string as a pasteboard type
- **Windows**: `RegisterClipboardFormat()` registers custom type names
- **Linux**: X11 atoms / Wayland MIME types can be any string

The limitation isn't the OS -- it's the browser's Clipboard API that restricts how custom MIME types are persisted. Chromium works around this by using `org.chromium.web-custom-data` as a container for all non-standard types.

### The Chromium Pickle format

The `org.chromium.web-custom-data` blob uses Chromium's "Pickle" binary serialization:

```
[u32 LE] payload size
[u32 LE] number of entries
For each entry:
  [u32 LE] MIME type character count (UTF-16 code units)
  [bytes]  MIME type as UTF-16LE
  [bytes]  padding to 4-byte alignment
  [u32 LE] value character count (UTF-16 code units)
  [bytes]  value as UTF-16LE
  [bytes]  padding to 4-byte alignment
```

For slackfmt, the blob contains a single entry: type `slack/texty` with the Quill Delta JSON as the value.

### Why this works

When you paste into Slack's desktop app (which is Electron/Chromium), it reads the `org.chromium.web-custom-data` blob from the OS clipboard, decodes the Pickle, finds the `slack/texty` entry, and interprets it as native Quill Delta rich text -- exactly as if you had copied from Slack itself.

The OS clipboard is just a dumb pipe. Both this addon and Slack's Electron app speak the same Chromium Pickle format, so the round-trip works transparently.

## References

- [The web's clipboard, and how it stores data of different types](https://alexharri.com/blog/clipboard) -- Deep dive into how `org.chromium.web-custom-data` works and the Pickle binary format
- [Web custom formats for the Async Clipboard API](https://developer.chrome.com/blog/web-custom-formats-for-the-async-clipboard-api) -- Official Chrome blog on custom clipboard format support
- [Chromium source: DataTransfer.cpp](https://chromium.googlesource.com/chromium/blink/+/refs/heads/main/Source/core/clipboard/DataTransfer.cpp) -- Chromium implementation of `clipboardData.setData()`
- [Chromium source: ui/base/clipboard](https://chromium.googlesource.com/chromium/src/+/master/ui/base/clipboard) -- Platform-specific clipboard code (macOS, Windows, Linux)
- [W3C Clipboard Pickling explainer](https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md) -- W3C spec discussion on custom clipboard formats
- [Chromium issue 487266](https://bugs.chromium.org/p/chromium/issues/detail?id=487266) -- Original Chromium issue for custom MIME type clipboard support

## Building

Requires Rust toolchain and Node.js:

```bash
pnpm install
pnpm build       # release build
pnpm build:debug  # debug build (faster compilation)
```

## Platform support

Pre-built binaries are provided for:

- macOS (arm64, x64)
- Windows (x64)
- Linux (x64, arm64)
