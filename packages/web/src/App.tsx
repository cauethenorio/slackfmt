import { useState } from "react";

import { DualPaneEditor } from "./components/DualPaneEditor";
import { Link } from "./components/Link";
import { useTheme } from "./hooks/useTheme";

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

export function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [tagline] = useState(() => taglines[Math.floor(Math.random() * taglines.length)]);
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface font-display text-text antialiased">
      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-0 md:px-4 max-w-[1600px] mx-auto w-full pt-6 md:pt-10 min-h-0">
        <div className="w-full flex flex-col gap-6 md:gap-6 min-h-0 flex-1">
          <div className="text-center shrink-0">
            <h1 className="text-xl lg:text-2xl tracking-tight text-text">
              <span className="font-mono font-bold text-2xl lg:text-3xl tracking-tighter">
                <span className="text-text">#</span>
                <span className="text-text">slack</span>
                <span className="text-slack-pink">f</span>
                <span className="text-slack-blue">m</span>
                <span className="text-slack-green">t</span>
                <span> </span>
              </span>

              <span className="handwritten-underline">{tagline}</span>
            </h1>
          </div>

          <DualPaneEditor theme={theme} onToggleTheme={toggleTheme} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 md:py-6 text-center text-base text-text-muted">
        <p>
          Also available as <Link href="https://github.com/cauethenorio/slackfmt#cli">CLI</Link> and{" "}
          <Link href="https://skills.sh/cauethenorio/slackfmt/slackfmt">Agent Skill</Link>.
        </p>
      </footer>
    </div>
  );
}
