---
"@slackfmt/core": patch
---

Fix slackemoji embeds being stripped during quill delta parsing

Non-string insert ops (like `{"slackemoji": {"text": ":zap:"}}`) were silently skipped, dropping emoji from converted output.
