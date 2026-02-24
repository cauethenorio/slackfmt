import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  preformattedCode: true,
});

turndown.addRule("brInPre", {
  filter(node) {
    return node.nodeName === "BR" && !!node.closest("pre");
  },
  replacement() {
    return "\n";
  },
});

export function htmlToMarkdown(input: string): string {
  return turndown.turndown(input);
}
