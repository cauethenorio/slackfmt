import { Moon, Sparkles, SquareTerminal, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const taglines = [
  "Because pasting into Slack shouldn't kill your links and nested lists",
  "Because Slack keeps eating your pasted links and nested lists",
  "Because pasting Markdown into Slack is pain",
  "Because Slack turns your beautiful pasted Markdown into a mess",
  "Because Slack thinks your pasted nested lists are just vibes",
  "Because Slack treats your formatting like a suggestion",
  "Because life's too short to reformat links and lists in Slack",
  "Because Slack looks at your nested lists and thinks 'not here'",
  "Paste Markdown into Slack. For real this time.",
];

const randomTagline = taglines[Math.floor(Math.random() * taglines.length)];

export function Header() {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-2 shrink-0 border-b-2 border-transparent [border-image:linear-gradient(to_right,#e01e5a,#ecb22e,#2eb67d,#36c5f0)_1]">
      <div className="flex items-center">
        <a href="/" className="font-mono font-bold text-sm text-text no-underline">
          <span className="opacity-40">#</span>slackfmt
        </a>
        <span className="hidden md:inline ml-3 text-xs text-text-muted">{randomTagline}</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/cauethenorio/slackfmt#cli"
          target="_blank"
          rel="noopener noreferrer"
          title="Install CLI"
          className="text-text-muted hover:text-text transition-colors"
        >
          <SquareTerminal size={16} aria-hidden="true" />
        </a>
        <a
          href="https://skills.sh/cauethenorio/slackfmt/slackfmt"
          target="_blank"
          rel="noopener noreferrer"
          title="Agent Skill"
          className="text-text-muted hover:text-text transition-colors"
        >
          <Sparkles size={16} aria-hidden="true" />
        </a>
        <a
          href="https://github.com/cauethenorio/slackfmt"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          className="text-text-muted hover:text-text transition-colors"
        >
          <GitHubIcon />
        </a>
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
