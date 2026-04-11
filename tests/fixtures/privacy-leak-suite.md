# Fixture — expect failure

## Dashed PAN must not appear

Target: privacy-leak-sample.txt
Reject Regex: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/
Fail: Card-like pattern must be redacted
