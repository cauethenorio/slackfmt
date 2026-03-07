interface CopyFlashProps {
  visible: boolean;
}

export function CopyFlash({ visible }: CopyFlashProps) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-copy-flash">
      <span className="text-3xl font-extrabold tracking-wide uppercase text-[var(--color-copy-flash-text)]">
        Copied!
      </span>
    </div>
  );
}
