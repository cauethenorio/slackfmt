interface CopyButtonProps {
  onClick: () => void;
}

export function CopyButton({ onClick }: CopyButtonProps) {
  return (
    <div className="sticky bottom-4 z-10 flex justify-end pr-4 mt-4 pointer-events-none">
      <button
        type="button"
        onClick={onClick}
        title="Copy for Slack"
        className="pointer-events-auto px-[60px] py-3 text-base font-semibold bg-copy-btn text-white rounded-lg cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:opacity-90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition-all"
      >
        Copy
      </button>
    </div>
  );
}
