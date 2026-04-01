import { nameToEmoji } from "gemoji";
import type { Op } from "quill/core";

/**
 * Replace :shortcode: patterns in string inserts with Unicode emoji
 * for preview rendering. Only known shortcodes are replaced.
 */
export function replaceEmojiShortcodes(delta: { ops: Op[] }): { ops: Op[] } {
  return {
    ops: delta.ops.map((op) => {
      if (typeof op.insert !== "string") return op;
      const replaced = op.insert.replace(/:([a-z0-9_+-]+):/g, (match, name) => {
        return nameToEmoji[name] ?? match;
      });
      if (replaced === op.insert) return op;
      return { ...op, insert: replaced };
    }),
  };
}
