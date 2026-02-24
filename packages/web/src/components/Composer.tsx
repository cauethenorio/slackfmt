import { useEffect, useRef } from "react";

interface ComposerProps {
  text: string;
  detectedType: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onCopy: () => void;
}

export function Composer({
  text,
  detectedType,
  disabled,
  onChange,
  onPaste,
  onCopy,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [text]);

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onCopy();
          }
        }}
        placeholder="Paste or type markdown here..."
        spellCheck={false}
      />
      <div className="composer-toolbar">
        <div>{detectedType && <span className="detected-badge">{detectedType}</span>}</div>
        <button type="button" className="send-btn" disabled={disabled} onClick={onCopy}>
          Copy for Slack
        </button>
      </div>
    </div>
  );
}
