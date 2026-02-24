import { convert, formats } from "@slackfmt/core";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { useCallback, useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { MessagePreview } from "./components/MessagePreview";

function deltaToHtml(json: string): string {
  const { ops } = JSON.parse(json);
  const converter = new QuillDeltaToHtmlConverter(ops, {
    multiLineParagraph: false,
  });
  return converter.convert();
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function App() {
  const [text, setText] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [messageTime, setMessageTime] = useState(timeNow());
  const [copied, setCopied] = useState(false);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const hadTextRef = useRef(false);

  // Live preview — update whenever text changes
  useEffect(() => {
    setCopied(false);
    if (!text.trim()) {
      setPreviewHtml(null);
      hadTextRef.current = false;
      return;
    }
    if (!hadTextRef.current) {
      setMessageTime(timeNow());
      hadTextRef.current = true;
    }
    let cancelled = false;
    convert(text, { format: "markdown" }).then((json) => {
      if (!cancelled) {
        setPreviewHtml(deltaToHtml(json));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const copyToClipboard = useCallback(async (markdown: string) => {
    if (!markdown.trim()) return;
    const json = await convert(markdown, { format: "markdown" });
    document.oncopy = (e) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", markdown);
      e.clipboardData?.setData("slack/texty", json);
      document.oncopy = null;
    };
    document.execCommand("copy");
    setMessageTime(timeNow());
    setCopied(true);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
        const markdown = matchedFormat.toMarkdown(data);
        setText(markdown);
        setDetectedType(matchedMime);
        copyToClipboard(markdown);
      } else {
        setDetectedType("text/plain");
      }
    },
    [copyToClipboard],
  );

  const handleCopy = useCallback(() => {
    copyToClipboard(text);
  }, [text, copyToClipboard]);

  return (
    <div className="app">
      <header className="channel-header">
        <div className="content-width">
          <span className="channel-name"># slackfmt</span>
        </div>
      </header>

      <div className="messages">
        <div className="content-width">
          <MessagePreview
            previewHtml={previewHtml}
            time={messageTime}
            copied={copied}
            onCopy={handleCopy}
          />
        </div>
      </div>

      <div className="composer-area">
        <div className="content-width">
          <Composer
            text={text}
            detectedType={detectedType}
            disabled={!text.trim()}
            onChange={(value) => {
              setText(value);
              setDetectedType(null);
            }}
            onPaste={handlePaste}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}
