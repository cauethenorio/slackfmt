import { SiGithub } from "@icons-pack/react-simple-icons";
import { useCallback, useState } from "react";
import { Link } from "./components/Link";
import { TextArea } from "./components/TextArea";
import { copyForSlack, extractPastedMarkdown } from "./utils/clipboard";

export function App() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (markdown: string) => {
    await copyForSlack(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const markdown = extractPastedMarkdown(e);
      if (markdown) {
        setText(markdown);
        handleCopy(markdown);
      }
    },
    [handleCopy],
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface font-display text-text antialiased">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-accent/10 bg-surface-header">
        <div className="flex items-center gap-2">
          <div className="flex font-mono font-bold text-xl tracking-tighter">
            <span className="text-white">#</span>
            &nbsp;
            <span className="text-white">slack</span>
            <span className="text-[#E01E5A]">f</span>
            <span className="text-[#36C5F0]">m</span>
            <span className="text-[#2EB67D]">t</span>
          </div>
        </div>
        <a
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-text transition-all border border-border-subtle"
          href="https://github.com/cauethenorio/slackfmt"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiGithub size={20} />
        </a>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 max-w-5xl mx-auto w-full py-12 min-h-0">
        <div className="w-full flex flex-col gap-8 min-h-0 flex-1">
          <div className="text-center space-y-2 shrink-0">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-text">
              Format text for Slack <span className="text-accent">instantly</span>
            </h1>
          </div>

          <TextArea
            value={text}
            copied={copied}
            onChange={(value) => {
              setText(value);
              setCopied(false);
            }}
            onPaste={handlePaste}
            onCopy={() => handleCopy(text)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-text-muted">
        <p>
          Also available as <Link href="https://github.com/cauethenorio/slackfmt#cli">CLI</Link> and{" "}
          <Link href="https://skills.sh/cauethenorio/slackfmt/slackfmt">Agent Skill</Link>.
        </p>
      </footer>
    </div>
  );
}
