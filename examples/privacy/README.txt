Privacy / redaction example
===========================

This folder shows how to guard generated text with Reject Regex rules so that
PAN-shaped patterns (16-digit payment card shapes) fail validation.

  safe-export.txt
    Sample export with no card-like numbers — should pass.

  redaction-suite.md
    Multiple Reject Regex patterns for common formats:
    - 16 consecutive digits
    - 0000-0000-0000-0000
    - 0000 0000 0000 0000
    - Combined patterns with optional separators

These are heuristic checks (not Luhn validation). Tune patterns for your
risk of false positives (e.g. long numeric IDs). See docs/privacy-redaction.md.

Run:

  npx textunittest validate examples/privacy/redaction-suite.md
