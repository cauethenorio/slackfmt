import { convert, formats } from "@slackfmt/core";

export async function copyForSlack(markdown: string): Promise<void> {
  if (!markdown.trim()) return;
  const json = await convert(markdown, { format: "markdown" });
  document.oncopy = (e) => {
    e.preventDefault();
    e.clipboardData?.setData("text/plain", markdown);
    e.clipboardData?.setData("slack/texty", json);
    document.oncopy = null;
  };
  document.execCommand("copy");
}

export function extractPastedMarkdown(e: React.ClipboardEvent<HTMLTextAreaElement>): string | null {
  const clipboardTypes = Array.from(e.clipboardData.types);
  let matchedMime: string | null = null;
  let matchedFormat: (typeof formats)[number] | null = null;
  for (const fmt of formats) {
    for (const mime of fmt.mimeTypes) {
      if (clipboardTypes.includes(mime)) {
        matchedMime = mime;
        matchedFormat = fmt;
        break;
      }
    }
    if (matchedMime) break;
  }

  if (matchedMime && matchedFormat && matchedMime !== "text/plain") {
    e.preventDefault();
    const data = e.clipboardData.getData(matchedMime);
    return matchedFormat.toMarkdown(data);
  }

  return null;
}
