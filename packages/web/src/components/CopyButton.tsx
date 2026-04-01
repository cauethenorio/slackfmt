interface CopyButtonProps {
  onClick: () => void;
}

export function CopyButton({ onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Copy for Slack"
      className="absolute bottom-4 right-4 z-10 px-[60px] py-3 text-sm font-semibold uppercase tracking-wider bg-copy-btn text-white rounded-lg cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:opacity-90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition-all"
    >
      Copy
    </button>
  );
}
