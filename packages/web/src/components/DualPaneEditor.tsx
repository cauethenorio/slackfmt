import { useCallback, useRef, useState } from "react";
import { useMarkdownConverter } from "../hooks/useMarkdownConverter";
import { useScrollSync } from "../hooks/useScrollSync";
import type { Theme } from "../hooks/useTheme";
import { copyFromEditor } from "../utils/clipboard";
import { CopyFlash } from "./CopyFlash";
import { layoutIcons } from "./LayoutIcons";
import { MarkdownPane } from "./MarkdownPane";
import { NavButtons } from "./NavButtons";
import { NeoButton } from "./NeoButton";
import { PaneHeader } from "./PaneHeader";
import { QuillPane } from "./QuillPane";

type Layout = "md-large" | "equal" | "preview-large";

const layoutOrder: Layout[] = ["equal", "md-large", "preview-large"];

const layoutClasses: Record<Layout, [string, string]> = {
  "md-large": ["flex-[2] md:flex-none md:w-2/3", "flex-1 md:flex-none md:w-1/3"],
  equal: ["flex-1 md:flex-none md:w-1/2", "flex-1 md:flex-none md:w-1/2"],
  "preview-large": ["flex-1 md:flex-none md:w-1/3", "flex-[2] md:flex-none md:w-2/3"],
};

interface DualPaneEditorProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function DualPaneEditor({ theme, onToggleTheme }: DualPaneEditorProps) {
  const [markdown, setMarkdown] = useState("");
  const [flash, setFlash] = useState(false);
  const [layout, setLayout] = useState<Layout>("equal");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);

  const { deltaJson, hasContent } = useMarkdownConverter(markdown);
  const [mdClasses, previewClasses] = layoutClasses[layout];

  useScrollSync(textareaRef, quillScrollRef, hasContent);

  const cycleLayout = useCallback(() => {
    setLayout((prev) => {
      const idx = layoutOrder.indexOf(prev);
      return layoutOrder[(idx + 1) % layoutOrder.length];
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!deltaJson) return;
    try {
      await copyFromEditor(deltaJson);
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    } catch {
      // Clipboard write failed silently — no flash shown
    }
  }, [deltaJson]);

  const handlePaste = useCallback((pastedMarkdown: string) => {
    setMarkdown(pastedMarkdown);
  }, []);

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
                onPaste={handlePaste}
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
