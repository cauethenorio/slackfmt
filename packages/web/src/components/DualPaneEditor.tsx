import { convert } from "@slackfmt/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { copyFromEditor } from "../utils/clipboard";
import { MarkdownPane } from "./MarkdownPane";
import { QuillPane } from "./QuillPane";

interface DualPaneEditorProps {
  copied: boolean;
  onCopied: () => void;
}

export function DualPaneEditor({ copied, onCopied }: DualPaneEditorProps) {
  const [markdown, setMarkdown] = useState("");
  const [deltaJson, setDeltaJson] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);
  const scrollingFrom = useRef<"textarea" | "quill" | null>(null);

  const hasContent = markdown.trim().length > 0;

  // Bidirectional proportional scroll sync
  useEffect(() => {
    if (!hasContent) return;

    const textarea = textareaRef.current;
    const getQuillEl = () => quillScrollRef.current;

    function syncScroll(source: "textarea" | "quill") {
      const quillEl = getQuillEl();
      if (!textarea || !quillEl) return;
      if (scrollingFrom.current && scrollingFrom.current !== source) return;

      scrollingFrom.current = source;

      const from = source === "textarea" ? textarea : quillEl;
      const to = source === "textarea" ? quillEl : textarea;
      const maxFrom = from.scrollHeight - from.clientHeight;
      const maxTo = to.scrollHeight - to.clientHeight;
      if (maxFrom > 0 && maxTo > 0) {
        to.scrollTop = (from.scrollTop / maxFrom) * maxTo;
      }

      requestAnimationFrame(() => {
        scrollingFrom.current = null;
      });
    }

    const onTextareaScroll = () => syncScroll("textarea");
    const onQuillScroll = () => syncScroll("quill");

    textarea?.addEventListener("scroll", onTextareaScroll, { passive: true });

    // Quill root may mount after this effect, poll briefly
    let quillEl = getQuillEl();
    const tryAttach = () => {
      quillEl = getQuillEl();
      if (quillEl) {
        quillEl.addEventListener("scroll", onQuillScroll, { passive: true });
        return true;
      }
      return false;
    };

    if (!tryAttach()) {
      const id = setInterval(() => {
        if (tryAttach()) clearInterval(id);
      }, 50);
      // Stop trying after 1s
      setTimeout(() => clearInterval(id), 1000);
    }

    return () => {
      textarea?.removeEventListener("scroll", onTextareaScroll);
      quillEl?.removeEventListener("scroll", onQuillScroll);
    };
  }, [hasContent]);

  // Convert markdown → delta JSON (no debounce)
  useEffect(() => {
    if (!hasContent) {
      setDeltaJson(null);
      return;
    }

    let cancelled = false;
    convert(markdown, { format: "markdown" }).then((result) => {
      if (cancelled) return;
      setDeltaJson(result);
    });

    return () => {
      cancelled = true;
    };
  }, [markdown, hasContent]);

  // Paste: set markdown + auto-copy
  const handlePaste = useCallback(
    (pastedMarkdown: string) => {
      setMarkdown(pastedMarkdown);
      convert(pastedMarkdown, { format: "markdown" })
        .then((result) => copyFromEditor(result))
        .then(() => onCopied())
        .catch(() => {});
    },
    [onCopied],
  );

  const handleCopy = useCallback(async () => {
    if (!deltaJson) return;
    await copyFromEditor(deltaJson);
    onCopied();
  }, [deltaJson, onCopied]);

  return (
    <div className="relative w-full group flex-1 min-h-0 flex flex-col">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
      <div className="relative bg-surface border border-border-subtle has-[:focus-within]:border-border-focus rounded-xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0 transition-colors">
        {/* Copy flash overlay */}
        {copied && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none animate-copy-flash">
            <span className="text-2xl font-bold tracking-wide uppercase text-surface">Copied!</span>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Markdown Textarea Pane */}
          <div
            className={`flex flex-col min-h-0 ${hasContent ? "md:w-1/2 md:border-r border-border-subtle" : "w-full"} transition-all`}
          >
            <div className="px-4 py-2 border-b border-border-subtle shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Markdown
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <MarkdownPane
                ref={textareaRef}
                value={markdown}
                onChange={setMarkdown}
                onPaste={handlePaste}
              />
            </div>
          </div>

          {/* Quill Preview Pane */}
          {hasContent && (
            <div className="md:w-1/2 flex flex-col min-h-0 animate-slide-up md:animate-none border-t md:border-t-0 border-border-subtle">
              <div className="px-4 py-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Slack Preview
                </span>
              </div>
              <QuillPane deltaJson={deltaJson} scrollRef={quillScrollRef} />
            </div>
          )}
        </div>

        {/* Copy Button */}
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
