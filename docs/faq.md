# FAQ

## Is TextUnitTest implemented yet?

Yes. Parsing, execution, CLI validation, and reporting are implemented; the package is published on npm as **`textunittest`**. The language and tooling will continue to evolve in minor ways.

## Where are the release notes?

See **[CHANGELOG.md](../CHANGELOG.md)** at the repository root (semver sections **0.5.0**, **0.4.0**, etc.). Each release lists user-facing DSL and documentation changes.

## Who is TextUnitTest for?

It is aimed at teams that want to validate generated text files with rules that non-technical users can still read and review.

## Is the DSL final?

No. The language and docs will keep evolving; minor rule additions or clarifications are expected. Breaking changes should be versioned (see [CHANGELOG](../CHANGELOG.md)).

## Why Markdown?

Markdown keeps suites readable in editors, pull requests, documentation portals, and source control.

## Will TextUnitTest support CI systems?

Yes. Use **Node.js 20+**, run `npx textunittest validate …` (or the library API) in your pipeline. See [CI integration](./ci-integration.md).

## How do I fail a test if credit card numbers appear in output?

Use **`Reject Regex:`** with patterns that match PAN-shaped strings (for example 16 digits, or grouped with spaces or dashes). See [Privacy / redaction](./privacy-redaction.md) and `examples/privacy/redaction-suite.md`. These checks are heuristic; tune patterns for false positives (long numeric IDs).

## Does `Length:` count characters or bytes?

`Length:` uses **UTF-8 bytes**, which usually matches the file’s size on disk for a UTF-8 text file. Character counts can differ when the text includes emoji or other multi-byte Unicode sequences.

## How do I put quotes inside a string literal?

Use **three delimiter styles** (`"`, `'`, or `` ` ``) so you can pick one that avoids clashing with the text, or **escape** using **doubled delimiters** (`""`, `''`, `` `` ``) or **backslashes** (`\"`, `\'`, `` \` ``). See the language specification section **String literals**.
