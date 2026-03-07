interface LinkProps {
  href: string;
  children: React.ReactNode;
}

export function Link({ href, children }: LinkProps) {
  return (
    <a
      className="text-text-link hover:text-text underline decoration-text-link/50 decoration-2 underline-offset-4 hover:decoration-text transition-colors font-bold"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
