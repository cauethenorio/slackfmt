export function PrivacyNotice() {
  return (
    <div
      className="hidden md:block absolute bottom-5 left-4 z-10 text-xs text-text-muted backdrop-blur-sm px-3 py-1 rounded-md"
      style={{ backgroundColor: "var(--color-privacy-bg)" }}
    >
      🔒 Your messages never leave your browser
    </div>
  );
}
