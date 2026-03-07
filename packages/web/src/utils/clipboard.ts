import { convert, formats, quillDeltaToMarkdown } from "@slackfmt/core";

export async function copyFromEditor(deltaJson: string): Promise<void> {
  const markdown = quillDeltaToMarkdown(deltaJson);
  if (!markdown.trim()) return;
  const slackDelta = await convert(markdown, { format: "markdown" });
  document.oncopy = (e) => {
    e.preventDefault();
    e.clipboardData?.setData("text/plain", markdown);
    e.clipboardData?.setData("slack/texty", slackDelta);
    document.oncopy = null;
  };
  // execCommand is deprecated but required to set custom MIME types (slack/texty)
  // that the async Clipboard API does not support
  document.execCommand("copy");
}

export function extractPastedMarkdown(e: ClipboardEvent): string | null {
  if (!e.clipboardData) return null;

  const clipboardTypes = Array.from(e.clipboardData.types);
  for (const fmt of formats) {
    for (const mime of fmt.mimeTypes) {
      if (clipboardTypes.includes(mime)) {
        const data = e.clipboardData.getData(mime);
        return fmt.toMarkdown(data);
      }
    }
  }

  return e.clipboardData.getData("text/plain") || null;
}
