import Quill from "quill";
import "quill/dist/quill.core.css";
import "../quill.css";
import { convert } from "@slackfmt/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { copyFromEditor, extractPastedMarkdown } from "../utils/clipboard";

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "strike", "code"],
  ["link"],
  [{ list: "bullet" }, { list: "ordered" }],
  ["blockquote", "code-block"],
];

const FORMATS = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "list",
  "indent",
  "blockquote",
  "code-block",
];

interface EditorProps {
  copied: boolean;
  onCopied: () => void;
}

export function Editor({ copied, onCopied }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [hasContent, setHasContent] = useState(false);

  const handleCopy = useCallback(async () => {
    const quill = quillRef.current;
    if (!quill || quill.getLength() <= 1) return;
    const delta = quill.getContents();
    await copyFromEditor(JSON.stringify(delta));
    onCopied();
  }, [onCopied]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editorDiv = document.createElement("div");
    container.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        clipboard: { matchers: [] },
      },
      formats: FORMATS,
      placeholder: "Paste your Markdown, HTML or text here to format it for Slack...",
    });

    quillRef.current = quill;

    // Track content changes for button visibility
    quill.on("text-change", () => {
      setHasContent(quill.getLength() > 1);
    });

    // Intercept all paste events
    quill.root.addEventListener("paste", (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const markdown = extractPastedMarkdown(e);
      if (!markdown) return;

      convert(markdown, { format: "markdown" }).then((deltaJson) => {
        const delta = JSON.parse(deltaJson);
        quill.setContents(delta);
        // Auto-copy after paste
        copyFromEditor(deltaJson).then(() => onCopied());
      });
    });

    // Cmd+Enter to copy
    quill.keyboard.addBinding({ key: "Enter", metaKey: true }, () => {
      if (quill.getLength() > 1) {
        const delta = quill.getContents();
        copyFromEditor(JSON.stringify(delta)).then(() => onCopied());
      }
      return false;
    });

    return () => {
      quillRef.current = null;
      container.innerHTML = "";
    };
  }, [onCopied]);

  return (
    <div className="relative w-full group flex-1 min-h-0 flex flex-col">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
      <div className="relative bg-surface border border-border-subtle has-[:focus-within]:border-border-focus rounded-xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0 transition-colors">
        <div ref={containerRef} className="flex-1 min-h-0 flex flex-col" />
        {hasContent && (
          <div className="flex justify-center px-8 py-4 shrink-0 animate-slide-up border-t border-border-subtle">
            <button
              type="button"
              onClick={handleCopy}
              disabled={copied}
              className={`px-5 py-2.5 font-bold rounded-lg text-sm transition-all duration-200 uppercase ${
                copied
                  ? "bg-success/20 text-success border border-success/30 cursor-default animate-wobble"
                  : "bg-success/70 hover:bg-success/90 text-white cursor-pointer"
              }`}
            >
              {copied ? "Copied to clipboard!" : "Copy Formatted for Slack"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
