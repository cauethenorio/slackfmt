import { forwardRef, useCallback } from "react";
import { extractPastedMarkdown } from "../utils/clipboard";

interface MarkdownPaneProps {
  value: string;
  onChange: (markdown: string) => void;
  onPaste?: (markdown: string) => void;
}

export const MarkdownPane = forwardRef<HTMLTextAreaElement, MarkdownPaneProps>(
  ({ value, onChange, onPaste }, ref) => {
    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const markdown = extractPastedMarkdown(e.nativeEvent);
        if (!markdown) return;

        e.preventDefault();
        onChange(markdown);
        onPaste?.(markdown);
      },
      [onChange, onPaste],
    );

    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        aria-label="Markdown input"
        placeholder="Type or paste your formatted content here..."
        spellCheck={false}
        className="w-full h-full resize-none bg-transparent text-text-secondary font-mono text-sm leading-relaxed p-5 outline-none placeholder:text-text-subtle"
      />
    );
  },
);

MarkdownPane.displayName = "MarkdownPane";
