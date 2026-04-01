import { useRef, useState } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { useLayout } from "../hooks/useLayout";
import { useMarkdownConverter } from "../hooks/useMarkdownConverter";
import { useScrollSync } from "../hooks/useScrollSync";
import { CopyButton } from "./CopyButton";
import { CopyFlash } from "./CopyFlash";
import { layoutIcons } from "./LayoutIcons";
import { MarkdownPane } from "./MarkdownPane";
import { PrivacyNotice } from "./PrivacyNotice";
import { QuillPane } from "./QuillPane";

const layoutClasses: Record<string, [string, string]> = {
  "md-large": ["flex-[2] md:flex-none md:w-2/3", "flex-1 md:flex-none md:w-1/3"],
  equal: ["flex-1 md:flex-none md:w-1/2", "flex-1 md:flex-none md:w-1/2"],
  "preview-large": ["flex-1 md:flex-none md:w-1/3", "flex-[2] md:flex-none md:w-2/3"],
};

export function DualPaneEditor() {
  const [markdown, setMarkdown] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);

  const { deltaJson, hasContent } = useMarkdownConverter(markdown);
  const { layout, cycleLayout } = useLayout();
  const { flash, handleCopy } = useClipboard(deltaJson);

  useScrollSync(textareaRef, quillScrollRef, hasContent);

  const [mdClass, previewClass] = layoutClasses[layout];

  return (
    <div className="relative flex-1 flex flex-col md:flex-row min-h-0">
      {/* Markdown Pane */}
      <div className={`flex flex-col min-h-0 flex-1 ${mdClass} transition-all`}>
        <div className="px-4 pt-2.5 pb-1 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-label-markdown">
            Markdown
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <MarkdownPane
            ref={textareaRef}
            value={markdown}
            onChange={setMarkdown}
            onPaste={setMarkdown}
          />
        </div>
      </div>

      {/* Divider with layout toggle */}
      <div className="hidden md:block relative w-[2px] shrink-0 bg-border">
        <button
          type="button"
          onClick={cycleLayout}
          title="Change layout"
          aria-label="Change layout"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted hover:text-text cursor-pointer z-10 transition-colors"
        >
          {layoutIcons[layout]}
        </button>
      </div>

      {/* Mobile divider with layout toggle */}
      <div className="md:hidden relative h-[2px] bg-border shrink-0">
        <button
          type="button"
          onClick={cycleLayout}
          title="Change layout"
          aria-label="Change layout"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center text-text-muted hover:text-text cursor-pointer z-10 transition-colors"
        >
          {layoutIcons[layout]}
        </button>
      </div>

      {/* Preview Pane */}
      <div
        className={`relative flex flex-col min-h-0 flex-1 ${previewClass} bg-surface-output transition-all`}
      >
        {hasContent && <CopyFlash visible={flash} />}
        <div className="px-4 pt-2.5 pb-1 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-label-preview">
            Slack Preview
          </span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <QuillPane deltaJson={deltaJson} scrollRef={quillScrollRef} />
        </div>
        {hasContent && <CopyButton onClick={handleCopy} />}
      </div>

      <PrivacyNotice />
    </div>
  );
}
