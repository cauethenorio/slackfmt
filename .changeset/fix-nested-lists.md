---
"@slackfmt/core": patch
---

Fix nested list indentation and ordered list numbering

- Use per-indent-level counters for ordered lists instead of a single global counter
- Switch to 4-space indentation for nested lists
- Fix numbering resets when mixing bullet/ordered lists at different nesting levels
