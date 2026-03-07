const bgMap = {
  "slack-pink": "bg-slack-pink",
  "slack-blue": "bg-slack-blue",
} as const;

interface PaneHeaderProps {
  label: string;
  color: keyof typeof bgMap;
  children?: React.ReactNode;
}

export function PaneHeader({ label, color, children }: PaneHeaderProps) {
  return (
    <div
      className={`px-4 py-2.5 border-b-[3px] border-border ${bgMap[color]} shrink-0 flex items-center`}
    >
      <span className="text-sm font-extrabold uppercase tracking-wider text-text">{label}</span>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
