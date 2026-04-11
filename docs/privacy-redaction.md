# Privacy and redaction patterns

Generated reports, exports, and logs should not contain **payment card numbers** (PANs) or other secrets. TextUnitTest uses **`Reject Regex:`** so that if a pattern matches anywhere in the output scope, the test **fails**.

## 16-digit PAN shapes (common formats)

The rules below assume a **16-digit** primary account number in common groupings. They are **not** a substitute for PCI compliance or Luhn checks; they catch obvious leaks in text exports.

| Intent | Example pattern |
|--------|------------------------|
| 16 digits in a row | `1234567890123456` |
| Dashed groups | `1234-5678-9012-3456` |
| Space-separated groups | `1234 5678 9012 3456` |
| Mixed separators | `1234-5678 9012-3456` |

### Suggested `Reject Regex` patterns

Use one or more of these in the same test (or split across tests):

1. **Contiguous 16 digits** (word boundaries reduce some false positives):

   ```md
   Reject Regex: /\b\d{16}\b/
   ```

2. **Dashed 4-4-4-4**:

   ```md
   Reject Regex: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/
   ```

3. **Spaced 4-4-4-4**:

   ```md
   Reject Regex: /\b\d{4} \d{4} \d{4} \d{4}\b/
   ```

4. **Optional dash or space between groups** (covers contiguous 16 digits as well as grouped forms):

   ```md
   Reject Regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/
   ```

5. **Strict grouping** (at least one separator between quartets; does **not** match a bare 16-digit run):

   ```md
   Reject Regex: /\b\d{4}(?:[- ]\d{4}){3}\b/
   ```

Combine with **`Fail:`** so CI logs explain the issue:

```md
Reject Regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/
Fail: Possible payment card number in output — redact before publishing
```

## Trade-offs

- **False positives** — Long numeric strings (e.g. some IDs) can look like PANs. Narrow the scope with **`Between:`** / **`After:`** / **`On Line:`** if only part of the file should be scanned.
- **Other card lengths** — Amex and other schemes use different lengths and groupings; extend patterns if needed.
- **Secrets** — For API keys, tokens, or national IDs, add separate **`Reject Regex:`** (or **`Reject:`** literals) for those formats.

## Example

See `examples/privacy/redaction-suite.md` and `examples/privacy/safe-export.txt`.
