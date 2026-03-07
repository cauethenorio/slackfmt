import { useRef, useState } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { useLayout } from "../hooks/useLayout";
import { useMarkdownConverter } from "../hooks/useMarkdownConverter";
import { useScrollSync } from "../hooks/useScrollSync";
import { CopyFlash } from "./CopyFlash";
import { layoutIcons } from "./LayoutIcons";
import { MarkdownPane } from "./MarkdownPane";
import { NeoButton } from "./NeoButton";
import { PaneHeader } from "./PaneHeader";
import { QuillPane } from "./QuillPane";

export function DualPaneEditor() {
  const [markdown, setMarkdown] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);

  const { deltaJson, hasContent } = useMarkdownConverter(markdown);
  const { layout, cycleLayout, mdClasses, previewClasses } = useLayout();
  const { flash, handleCopy } = useClipboard(deltaJson);

  useScrollSync(textareaRef, quillScrollRef, hasContent);

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col">
      <div className="relative bg-surface-card border-[3px] border-border rounded-none md:rounded-2xl overflow-hidden shadow-none md:shadow-[6px_6px_0px_0px_var(--color-neo-shadow)] flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col md:flex-row relative">
          {/* Markdown Pane */}
          <div
            className={`flex flex-col min-h-0 transition-all ${hasContent ? `${mdClasses} md:border-r-[3px] md:border-border` : "w-full"}`}
          >
            <PaneHeader label="Markdown" color="slack-pink">
              <div className="w-7 h-7 invisible" aria-hidden="true" />
            </PaneHeader>
            <div className="flex-1 min-h-0 relative">
              <MarkdownPane
                ref={textareaRef}
                value={markdown}
                onChange={setMarkdown}
                onPaste={setMarkdown}
              />
            </div>
          </div>

          {/* Quill Preview Pane */}
          {hasContent && (
            <div
              className={`relative ${previewClasses} flex flex-col min-h-0 animate-slide-up md:animate-none border-t-[3px] md:border-t-0 border-border transition-all`}
            >
              <CopyFlash visible={flash} />
              <PaneHeader label="Slack Preview" color="slack-blue">
                <button
                  type="button"
                  onClick={cycleLayout}
                  title="Change layout"
                  aria-label="Change layout"
                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-border/50 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  {layoutIcons[layout]}
                </button>
              </PaneHeader>
              <QuillPane deltaJson={deltaJson} scrollRef={quillScrollRef} />
            </div>
          )}
        </div>

        {/* Floating Copy button */}
        {hasContent && (
          <NeoButton
            size="lg"
            onClick={handleCopy}
            className="absolute bottom-4 right-4 z-10 bg-slack-green text-white"
          >
            Copy
          </NeoButton>
        )}
      </div>
    </div>
  );
}
