import { useRef, useState } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { useLayout } from "../hooks/useLayout";
import { useMarkdownConverter } from "../hooks/useMarkdownConverter";
import { useScrollSync } from "../hooks/useScrollSync";
import type { Theme } from "../hooks/useTheme";
import { CopyFlash } from "./CopyFlash";
import { layoutIcons } from "./LayoutIcons";
import { MarkdownPane } from "./MarkdownPane";
import { NavButtons } from "./NavButtons";
import { NeoButton } from "./NeoButton";
import { PaneHeader } from "./PaneHeader";
import { QuillPane } from "./QuillPane";

interface DualPaneEditorProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function DualPaneEditor({ theme, onToggleTheme }: DualPaneEditorProps) {
  const [markdown, setMarkdown] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);

  const { deltaJson, hasContent } = useMarkdownConverter(markdown);
  const { layout, cycleLayout, mdClasses, previewClasses } = useLayout();
  const { flash, handleCopy } = useClipboard(deltaJson);

  useScrollSync(textareaRef, quillScrollRef, hasContent);

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col">
      {/* Theme & GitHub buttons — right of markdown title on mobile, fixed top-right on desktop */}
      <div className="absolute -top-3 right-4 md:fixed md:top-4 md:right-4 lg:right-6 z-30 flex items-center gap-2 md:gap-3">
        <NavButtons theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      <div className="relative bg-surface-card border-[3px] border-border rounded-none md:rounded-2xl overflow-hidden shadow-none md:shadow-[6px_6px_0px_0px_var(--color-neo-shadow)] flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col md:flex-row relative">
          {/* Markdown Pane */}
          <div
            className={`flex flex-col min-h-0 transition-all ${hasContent ? `${mdClasses} md:border-r-[3px] md:border-border` : "w-full"}`}
          >
            <PaneHeader label="Markdown" color="slack-pink" />
            <div className="flex-1 min-h-0 relative">
              <MarkdownPane
                ref={textareaRef}
                value={markdown}
                onChange={setMarkdown}
                onPaste={setMarkdown}
              />
              {hasContent && (
                <NeoButton
                  size="sm"
                  onClick={cycleLayout}
                  title="Change layout"
                  aria-label="Change layout"
                  className="absolute bottom-4 right-4 z-10"
                >
                  {layoutIcons[layout]}
                </NeoButton>
              )}
            </div>
          </div>

          {/* Quill Preview Pane */}
          {hasContent && (
            <div
              className={`relative ${previewClasses} flex flex-col min-h-0 animate-slide-up md:animate-none border-t-[3px] md:border-t-0 border-border transition-all`}
            >
              <CopyFlash visible={flash} />
              <PaneHeader label="Slack Preview" color="slack-blue" />
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
