import { nameToEmoji } from "gemoji";
import type { Op } from "quill/core";

const EMOJI_RE = /:([a-z0-9_+-]+):/g;
const MENTION_RE = /@(\S+)/g;

function replaceEmoji(text: string): string {
  return text.replace(EMOJI_RE, (match, name) => nameToEmoji[name] ?? match);
}

function splitMentions(ops: Op[]): Op[] {
  const result: Op[] = [];
  for (const op of ops) {
    if (typeof op.insert !== "string" || !MENTION_RE.test(op.insert)) {
      result.push(op);
      continue;
    }

    MENTION_RE.lastIndex = 0;
    let lastIndex = 0;

    for (
      let match = MENTION_RE.exec(op.insert);
      match !== null;
      match = MENTION_RE.exec(op.insert)
    ) {
      if (match.index > lastIndex) {
        result.push({ ...op, insert: op.insert.slice(lastIndex, match.index) });
      }
      result.push({
        insert: match[0],
        attributes: { ...op.attributes, mention: true },
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < op.insert.length) {
      result.push({ ...op, insert: op.insert.slice(lastIndex) });
    }
  }
  return result;
}

/**
 * Transform a delta for preview rendering:
 * - Replace :shortcode: patterns with Unicode emoji
 * - Mark @mentions with a custom attribute for styling
 */
export function transformDeltaForPreview(delta: { ops: Op[] }): { ops: Op[] } {
  const emojiOps = delta.ops.map((op) => {
    if (typeof op.insert !== "string") return op;
    const replaced = replaceEmoji(op.insert);
    if (replaced === op.insert) return op;
    return { ...op, insert: replaced };
  });

  return { ops: splitMentions(emojiOps) };
}
