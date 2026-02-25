interface TextAreaProps {
  value: string;
  copied: boolean;
  onChange: (value: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onCopy: () => void;
}

export function TextArea({ value, copied, onChange, onPaste, onCopy }: TextAreaProps) {
  const showButton = value.trim().length > 0;

  return (
    <div className="relative w-full group flex-1 min-h-0 flex flex-col">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
      <div className="relative bg-surface border border-border-subtle has-[:focus]:border-border-focus rounded-xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0 transition-colors">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onCopy();
            }
          }}
          className="flex-1 w-full bg-transparent border-none text-text-secondary placeholder:text-text-subtle focus:ring-0 focus:outline-none resize-none p-8 pb-4 text-base font-mono leading-relaxed overflow-y-auto"
          placeholder="Paste your Markdown, HTML or text here to format it for Slack..."
          spellCheck={false}
        />
        {showButton && (
          <div className="flex justify-center px-8 py-4 shrink-0 animate-slide-up border-t border-border-subtle">
            <button
              type="button"
              onClick={onCopy}
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
