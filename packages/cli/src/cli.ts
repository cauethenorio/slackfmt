import { writeClipboard } from "@slackfmt/clipboard";
import { convert, formats, type InputFormat } from "@slackfmt/core";
import meow from "meow";
import { detectFormat } from "./detect.js";

const formatIds = formats.map((f) => f.id).join(", ");

const cli = meow(
  `
  Usage
    $ slackfmt [options]

  Options
    --format, -f   Input format: ${formatIds} (default: auto-detect)
    --stdout       Output to stdout instead of clipboard
    --help         Show this help

  Examples
    $ echo "**bold**" | slackfmt -f markdown
    $ cat doc.md | slackfmt
    $ slackfmt -f html < page.html
`,
  {
    importMeta: import.meta,
    autoHelp: false,
    flags: {
      format: { type: "string", shortFlag: "f" },
      stdout: { type: "boolean", default: false },
    },
  },
);

export async function run(): Promise<void> {
  if (process.stdin.isTTY) {
    console.error(cli.help);
    process.exit(0);
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const input = Buffer.concat(chunks).toString("utf-8");

  if (!input.trim()) {
    console.error(cli.help);
    process.exit(1);
    return;
  }

  const format: InputFormat = (cli.flags.format as InputFormat) || detectFormat(input);

  const delta = await convert(input, { format });

  if (cli.flags.stdout) {
    process.stdout.write(delta);
  } else {
    writeClipboard(input, delta);
    console.error("Copied to clipboard!");
  }
}
