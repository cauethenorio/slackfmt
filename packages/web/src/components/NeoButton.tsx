import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn";

const base =
  "flex items-center justify-center rounded-xl border-[3px] border-border bg-surface-card text-text shadow-[4px_4px_0px_0px_var(--color-neo-shadow)] hover:shadow-[2px_2px_0px_0px_var(--color-neo-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer transition-all";

const sizeClasses = {
  sm: "w-8 h-8 md:w-10 md:h-10 rounded-lg border-[2px] shadow-[2px_2px_0px_0px_var(--color-neo-shadow)] md:shadow-[3px_3px_0px_0px_var(--color-neo-shadow)] hover:shadow-[1px_1px_0px_0px_var(--color-neo-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]",
  md: "p-2.5",
  lg: "px-8 py-3 text-base font-extrabold uppercase",
} as const;

type Size = keyof typeof sizeClasses;

interface NeoButtonProps extends ComponentPropsWithoutRef<"button"> {
  size?: Size;
}

export function NeoButton({ size = "md", className = "", children, ...props }: NeoButtonProps) {
  return (
    <button type="button" className={cn(base, sizeClasses[size], className)} {...props}>
      {children}
    </button>
  );
}

interface NeoButtonLinkProps extends ComponentPropsWithoutRef<"a"> {
  size?: Size;
}

export function NeoButtonLink({
  size = "sm",
  className = "",
  children,
  ...props
}: NeoButtonLinkProps) {
  return (
    <a className={cn(base, sizeClasses[size], className)} {...props}>
      {children}
    </a>
  );
}
