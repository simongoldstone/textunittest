# TextUnitTest Language Specification

This document defines the TextUnitTest Markdown DSL as implemented in the reference parser and engine (v1 rule set; see [CHANGELOG](../CHANGELOG.md) for versioned changes).

## Purpose

TextUnitTest describes validation rules for text files using readable Markdown. A test suite is a Markdown document containing one or more test cases. Each test case declares a target file and one or more assertions that should be evaluated against that file or a narrowed section of that file.

## Document Structure

A suite is expected to follow this general structure:

```md
# Suite Title

## Test Name

Target: path/to/file.txt
Require: "Some text"
Fail: Custom failure message
```

### Suite Heading

- The first level-one heading names the suite.
- The suite heading is descriptive metadata and is not itself a test.

### Test Heading

- Each test begins with a level-two heading.
- The level-two heading text becomes the human-readable test name.

Example:

```md
## Ensure version number exists
```

## Rule Model

Each rule is written as `Key: Value` on its own line.

- Rule names are written in title case as shown in this specification.
- A line that is only a full-line **HTML comment** (`<!-- ... -->`) is ignored so you can leave short notes in the suite file.
- A test should contain exactly one `Target:` rule.
- Assertion rules evaluate the selected text scope.
- Location rules such as `Between:`, `After:`, `Before:`, `On Line:`, and `Between Lines:` narrow the scope before assertions run.
- `Fail:` provides a human-readable message that may be shown if the test fails.

### String literals

Several rules take a **string literal** value (`Require:`, `Reject:`, `After:`, `Before:`, `Starts With:`, `Ends With:`, the literal form of `Count:`, and each side of `Between:`). A string literal must use one of these opening/closing delimiters:

| Delimiter | Example |
|-----------|---------|
| Double quote | `"hello"` |
| Single quote | `'hello'` |
| Backtick | `` `hello` `` |

The closing delimiter must match the opening delimiter.

**Escaping** — you may include delimiter characters inside the string using either of these mechanisms:

1. **Doubling the delimiter** (SQL/CSV style): inside a double-quoted string, `""` represents one `"` character. Similarly `''` inside single quotes, and `` `` `` (two backticks) inside a backtick string represent one backtick.
2. **Backslash escapes**: `\"`, `\'`, `` \` ``, and `\\` produce `"`, `'`, `` ` ``, and `\` respectively.

Doubling is evaluated before a closing delimiter is recognized: a single closing delimiter ends the string; two delimiters in a row emit one delimiter character in the output.

**Paths** (`Target:`) may be unquoted if they contain no spaces, or quoted with any of the three delimiter styles if the path contains spaces or special characters.

## Supported Rules

For **wildcard**, **fuzzy**, and **structured format** assertions (regex-free), see [Matching extensions](./matching-extensions-spec.md).

### `Target:`

Declares the file that the test should validate.

- The value is a file path.
- Relative paths are expected to be resolved relative to the suite file.
- Paths with spaces or other special characters should use a string literal (see **String literals**).

Example:

```md
Target: invoice.txt
Target: 'my invoice file.txt'
```

### `Require:`

Asserts that a literal string must appear at least once in the current scope.

- The value is a string literal (see **String literals**).
- Matching behavior may be affected by the `Case:` rule.

Example:

```md
Require: "Version:"
Require: 'Status: "OK"'
Require: `say ""hello""`
```

### `Reject:`

Asserts that a literal string must not appear in the current scope.

Example:

```md
Reject: "ERROR"
```

### `Require Any Of:`

At least **one** of the quoted options must appear in the current scope (logical **OR**). Use the word **`or`** between each option (case-insensitive). You need at least two options; for a single phrase use **`Require:`** instead.

Example:

```md
Require Any Of: "Name" or "Address" or "Postcode"
```

### `Reject Any Of:`

**None** of the quoted options may appear. If **any** of them is found, the test fails. Same `or` syntax as **`Require Any Of:`**.

Example:

```md
Reject Any Of: "ERROR" or "FAILED" or "TBD"
```

### `Regex:`

Asserts that a regular expression must match at least once in the current scope.

- Regular expressions are written using slash delimiters.
- Standard regex flags such as `i` may be used where supported by the eventual implementation.

Example:

```md
Regex: /Invoice Number: INV-\d{4}/
```

### `Reject Regex:`

Asserts that a regular expression must not match in the current scope.

Example:

```md
Reject Regex: /Status:\s+FAIL/
```

For **privacy and redaction** (e.g. blocking payment card–shaped numbers in generated output), see [Privacy / redaction](./privacy-redaction.md).

### `Reject Format:`

The opposite of **`Require Format:`**: the scope must **not** contain any valid match for the given format (email, date, UUID, mask, etc.). Uses the same format names as **`Require Format:`** (see [Matching extensions](./matching-extensions-spec.md)).

Example:

```md
Reject Format: Email
```

### `Line Must Equal:`

The **entire text of one line** in the **whole file** (by 1-based line number) must equal the quoted string after **trimming** leading and trailing spaces on both sides. The line must also fall inside the current scope (after any **`Between:`** / **`After:`** narrowing). If the line does not exist, the test fails.

Example:

```md
Line Must Equal: 1 "BEGIN REPORT"
```

### `First Line Must Equal:`

The **first line** of the current scope must equal the quoted string after trimming. (Use with location rules to target a section.)

### `Last Line Must Equal:`

The **last non-blank line** of the current scope must equal the quoted string after trimming. Trailing empty lines (for example from a final newline at end of file) are ignored so the last *content* line is checked.

### `Between:`

Narrows the scope to the text between two literal markers.

- The syntax is `"start"` and `"end"`.
- The narrowed region is intended to exclude the boundary markers unless a future implementation states otherwise.

Example:

```md
Between: "Welcome" and "Copyright"
```

### `After:`

Narrows the scope to text that appears after a literal marker.

Example:

```md
After: "Summary"
```

### `Before:`

Narrows the scope to text that appears before a literal marker.

Example:

```md
Before: "Generated by Internal Reporting"
```

### `On Line:`

Narrows the scope to a **single line** of the target file.

- The value is one positive integer: the **1-based line number** in the **entire target file** (not renumbered inside `After:` / `Between:` sections).
- The narrowed region is the text of that line **without** its trailing newline character.
- If that line does not exist, or does not overlap the scope produced by earlier location rules, the test fails with an `On Line:` location error.

Example (assert that a valid email appears on line 12 — often paired with `Require Format:`):

```md
On Line: 12
Require Format: Email
```

### `Between Lines:`

Narrows the scope to a **contiguous inclusive range** of lines in the target file.

- The value is `N and M` (keywords are case-insensitive): **1-based line numbers** in the **entire file**, with `N ≤ M`.
- The narrowed region runs from the start of line `N` through the end of line `M` (still excluding each line’s trailing newline from the line boundaries, but **newlines between lines** are included in the scope string so assertions behave like the same text slice).
- If any line in the range does not exist, or the range does not overlap the scope from earlier location rules, the test fails with a `Between Lines:` location error.

Example (assert that a mask match appears somewhere between lines 15 and 22):

```md
Between Lines: 15 and 22
Require Format: Mask(AAAA-9999999)
```

### `Count:`

Asserts how many times a literal substring or regex matches in the current scope.

**Literal counts** (non-overlapping: each match advances past the end of the previous match):

- `Count: N of "literal"` — **exactly** `N`
- `Count: at least N of "literal"`
- `Count: at most N of "literal"`
- `Count: between N and M of "literal"` (inclusive)

**Regex match counts** (non-overlapping matches, with `g` semantics):

- `Count: N matches /regex/`
- `Count: at least N matches /regex/`
- `Count: at most N matches /regex/`
- `Count: between N and M matches /regex/`

Examples:

```md
Count: 2 of "Line Item:"
Count: at least 1 of "Status"
Count: between 1 and 5 of "Item:"
Count: 1 matches /Started:\s+\d{4}-\d{2}-\d{2}T/
Count: at least 1 matches /warning/i
```

### `Starts With:`

Asserts that the current scope begins with the given literal string.

Example:

```md
Starts With: "Quarterly Report"
```

### `Ends With:`

Asserts that the current scope ends with the given literal string.

Implementation note: **trailing newlines** at the end of the scope are ignored so typical text files that end with a final line break still match the last line of content.

Example:

```md
Ends With: "Generated by Internal Reporting"
```

### `Length:`

Asserts constraints on the **size of the target file** as stored on disk.

- Measurement is the **UTF-8 byte length** of the file contents (the same value you get when counting bytes in the UTF-8 encoding). This matches typical “file size” for a UTF-8 text file and can differ from the number of Unicode characters when the text contains multi-byte sequences.
- `Length:` rules always apply to the **entire target file**, not the narrowed scope used by location rules (`Between:`, `After:`, `Before:`, `On Line:`, `Between Lines:`) or other assertions.

Supported forms (keywords are case-insensitive; `N` and `M` are non-negative integers):

- `Length: at least N`
- `Length: at most N`
- `Length: exactly N`
- `Length: between N and M` (inclusive of both bounds)

Examples:

```md
Length: at least 1000
Length: at most 50000
Length: exactly 2048
Length: between 100 and 2000
```

### `Case:`

Controls whether literal and regex matching is case-sensitive.

The supported values are:

- `Case: sensitive`
- `Case: insensitive`

Example:

```md
Case: insensitive
```

### `Fail:`

Provides a custom failure message for the test.

- This message should explain the business meaning of the failure.
- It does not change evaluation behavior.

Example:

```md
Fail: Version number missing from header
```

## Scope Composition

When a test contains location rules, TextUnitTest should narrow the search scope before evaluating content assertions.

Behavior in the v1 reference implementation:

1. Load the target file contents.
2. Start with the full file as the active scope.
3. Apply location rules in the order they appear (including `On Line:` and `Between Lines:` mixed with marker-based rules). Each step **intersects** the new constraint with the current scope: the result is only text that satisfies **all** location rules applied so far.
4. Evaluate remaining rules in **document order**. Each rule is either:
   - a `Length:` check against the **whole file** (UTF-8 byte length), or
   - any other assertion (`Require:`, `Regex:`, etc.) against the **narrowed scope** produced in step 3.

**Line numbers** (`On Line:`, `Between Lines:`) always refer to the **full target file**, even when combined with `After:`, `Before:`, or `Between:`. The engine keeps only the overlap between the marker-narrowed region and the requested line(s); if they do not overlap, the location step fails.

This ordered approach keeps the DSL readable while allowing targeted validation in specific sections of a file. Interleaving `Length:` with other assertions is allowed; `Length:` still measures the full file, while other assertions use the narrowed scope.

## Minimal Example

```md
# Invoice Validation Suite

## Ensure version number exists

Target: invoice.txt
Require: "Version:"
Between: "Welcome" and "Copyright"
Fail: Version number missing from header
```

## Implementation notes

The reference implementation in this repository includes:

- **Parser** — Line-oriented Markdown parsing; strict rule keys; string literals as documented under **String literals**; full-line **`<!-- ... -->`** HTML comments ignored under tests.
- **Engine** — Scope rules applied in order; assertions and `Length:` as described under **Scope Composition**; failure messages include a **Line:** hint (1-based line in the target file at the start of the narrowed scope). Supports **`Require Any Of:`** / **`Reject Any Of:`**, extended **`Count:`** bounds, **`Line Must Equal:`** / **`First Line Must Equal:`** / **`Last Line Must Equal:`**, **`Reject Format:`**, and all rules listed in **Supported Rules**.
- **CLI** — Human-readable console output and optional HTML report; exit codes 0 / 1 for automation.
- **Path resolution** — `Target:` paths are resolved relative to the suite file; the runtime is **Node.js** with UTF-8 file reads.

Not yet standardized or out of scope for the current docs:

- Machine-readable report formats (e.g. JUnit JSON) for CI dashboards
- Graceful recovery from malformed Markdown beyond clear parse errors
- Non-Node or non–UTF-8 execution environments
