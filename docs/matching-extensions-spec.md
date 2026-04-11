# TextUnitTest matching extensions

This document describes **wildcard**, **fuzzy**, **format**, and **line-scoped** matching. The implementation follows these rules; defaults such as `*` span length (50) and fuzzy defaults (85% tolerance, ±30% windows) are fixed for v1 unless noted.

## Summary

| Rule | Purpose |
|------|---------|
| `Require Pattern:` | Glob-style `*` (0–50 chars per segment, single line, non-greedy) and `?` (one character) |
| `Fuzzy Require:` | Line-based Levenshtein similarity with sliding windows |
| `Tolerance:` | 50–100% similarity for the following fuzzy rules (default 85% if omitted) |
| `Require Format:` | Dates, phones, email, UUID, masks, etc., without regex |
| `On Line:` | Narrow scope to one 1-based file line (pairs with format or other assertions) |
| `Between Lines:` | Narrow scope to an inclusive 1-based line range in the file |

## Wildcard (`Require Pattern:`)

- `*` matches up to **50** characters on **one line** (does not cross newlines); matching is **non-greedy** (shortest successful span).
- `?` matches exactly one character.
- Internally compiled to a bounded, non-greedy regular expression.

## Fuzzy (`Fuzzy Require:` + optional `Tolerance:`)

- Phrase length must be **≥ 5** characters.
- Tolerance is **50%–100%** (`Tolerance: 90` or `Tolerance: 90%`). Default **85%** when not specified.
- Compares **each line** in the scope using **sliding windows** whose lengths are between **70% and 130%** of the expected phrase length; **Levenshtein** similarity must reach the tolerance.
- Uses the [`fastest-levenshtein`](https://www.npmjs.com/package/fastest-levenshtein) package.

## Format (`Require Format:`)

Built-in forms include:

- `Date(dd-mm-yyyy)`, `Date(dd/mm/yyyy)`, `Date(yyyy-mm-dd)`, `Date(mm-dd-yyyy)` — format + calendar validity.
- `Phone(...)` — mask: `9` digit, `A` upper, `a` lower, `*` alphanumeric, other chars literal.
- `Email`, `Integer`, `Decimal`, `Currency(£)` (or other symbol), `UUID`, `UKPostcode`.
- `Mask(INV-9999-AAA)` — custom mask with the same symbol table as phone.

Failures include **Line:** (1-based in the target file at the start of the narrowed scope) and a readable message.

## Line-scoped formats

Natural-language intent maps to **`On Line:`** / **`Between Lines:`** plus **`Require Format:`** (see the main [language specification](./language-specification.md) for full rules).

| Intent | DSL sketch |
|--------|------------|
| “A valid email address appears on line 12” | `On Line: 12` then `Require Format: Email` |
| “A valid date appears on line 9” | `On Line: 9` then `Require Format: Date(yyyy-mm-dd)` (or another `Date(...)` form) |
| “A code matching the pattern AAAA-0000000 appears between lines 15 and 22” | `Between Lines: 15 and 22` then `Require Format: Mask(AAAA-9999999)` |

**Mask digits:** in `Mask(...)` and `Phone(...)`, use **`9`** for a digit position. A human-readable “0000000” segment is written as `9999999` in the mask string.

## Validation order

Rules are **explicit** in the suite: authors choose `Require:`, `Require Pattern:`, `Fuzzy Require:`, or `Require Format:` per line. The engine evaluates rules in **document order**; there is no automatic overlap between exact and wildcard on the same line unless both rules are written.
