import { Lock } from "lucide-react";

export function PrivacyNotice() {
  return (
    <div
      className="hidden md:flex items-center gap-1.5 absolute bottom-5 left-4 z-10 text-xs text-text-muted backdrop-blur-sm px-3 py-1 rounded-md"
      style={{ backgroundColor: "var(--color-privacy-bg)" }}
    >
      <Lock size={12} aria-hidden="true" />
      Your messages never leave your browser
    </div>
  );
}
