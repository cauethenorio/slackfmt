type Layout = "md-large" | "equal" | "preview-large";

export const layoutIcons: Record<Layout, React.ReactNode> = {
  "md-large": (
    <svg
      width="16"
      height="12"
      viewBox="0 0 20 14"
      fill="none"
      aria-hidden="true"
      className="rotate-90 md:rotate-0"
    >
      <rect x="0" y="0" width="13" height="14" rx="2" fill="var(--color-text)" opacity="0.7" />
      <rect x="14" y="0" width="6" height="14" rx="2" fill="var(--color-text)" opacity="0.35" />
    </svg>
  ),
  equal: (
    <svg
      width="16"
      height="12"
      viewBox="0 0 20 14"
      fill="none"
      aria-hidden="true"
      className="rotate-90 md:rotate-0"
    >
      <rect x="0" y="0" width="9" height="14" rx="2" fill="var(--color-text)" opacity="0.7" />
      <rect x="11" y="0" width="9" height="14" rx="2" fill="var(--color-text)" opacity="0.7" />
    </svg>
  ),
  "preview-large": (
    <svg
      width="16"
      height="12"
      viewBox="0 0 20 14"
      fill="none"
      aria-hidden="true"
      className="rotate-90 md:rotate-0"
    >
      <rect x="0" y="0" width="6" height="14" rx="2" fill="var(--color-text)" opacity="0.35" />
      <rect x="7" y="0" width="13" height="14" rx="2" fill="var(--color-text)" opacity="0.7" />
    </svg>
  ),
};
