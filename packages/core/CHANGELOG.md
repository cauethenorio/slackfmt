# @slackfmt/core

## 0.3.1

### Patch Changes

- 7617ca6: Fix adjacent bold/italic/strike segments producing invalid markdown markers
- 7617ca6: Preserve original spacing before lists instead of always inserting a blank line

## 0.3.0

### Minor Changes

- 64b5c35: Detect syntax-highlighted markdown in HTML input and extract as plain text instead of escaping

### Patch Changes

- 64b5c35: Preserve original spacing before lists instead of always inserting a blank line
- 64b5c35: Fix nested list indentation and ordered list numbering

  - Use per-indent-level counters for ordered lists instead of a single global counter
  - Switch to 4-space indentation for nested lists
  - Fix numbering resets when mixing bullet/ordered lists at different nesting levels

## 0.2.0

### Minor Changes

- ae29dc5: Convert markdown tables to code blocks for Slack compatibility
