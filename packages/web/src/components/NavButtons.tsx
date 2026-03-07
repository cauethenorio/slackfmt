import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Theme } from "../hooks/useTheme";
import { NeoButton, NeoButtonLink } from "./NeoButton";

interface NavButtonsProps {
  theme: Theme;
  onToggleTheme: () => void;
}

export function NavButtons({ theme, onToggleTheme }: NavButtonsProps) {
  return (
    <>
      <NeoButton
        size="sm"
        onClick={onToggleTheme}
        className="text-sm md:text-lg"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </NeoButton>
      <NeoButtonLink
        size="sm"
        href="https://github.com/cauethenorio/slackfmt"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <SiGithub size={16} className="md:!w-5 md:!h-5" />
      </NeoButtonLink>
    </>
  );
}
