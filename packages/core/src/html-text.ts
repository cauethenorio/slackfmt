import type { RootContent } from "hast";
import rehypeParse from "rehype-parse";
import { unified } from "unified";

const HIDDEN_TAGS = new Set(["head", "style", "script", "title", "template"]);
const INLINE_TAGS = new Set(
  "a abbr b bdi bdo big cite code data del dfn em font i ins kbd label mark q s samp small span strike strong sub sup td th time tt u var wbr".split(
    " ",
  ),
);

const parser = unified().use(rehypeParse, { fragment: true });

/** The text of a piece of HTML with its tags stripped, one string for each block or line. */
export function htmlBlockTexts(html: string): string[] {
  const texts: string[] = [];
  let current = "";
  const end = () => {
    const text = current.replace(/\s+/g, " ").trim();
    if (text) texts.push(text);
    current = "";
  };
  const visit = (nodes: RootContent[]) => {
    for (const node of nodes) {
      if (node.type === "text") current += node.value;
      if (node.type !== "element" || HIDDEN_TAGS.has(node.tagName)) continue;
      const inline = INLINE_TAGS.has(node.tagName);
      if (!inline) end();
      if (node.tagName === "td" || node.tagName === "th") current += " ";
      visit(node.children as RootContent[]);
      if (!inline) end();
    }
  };
  visit(parser.parse(html).children as RootContent[]);
  end();
  return texts;
}
