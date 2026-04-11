# FAQ

## Is TextUnitTest implemented yet?

Core pieces are implemented: parsing, execution, CLI validation, and reporting. The language and tooling will continue to evolve.

## Who is TextUnitTest for?

It is aimed at teams that want to validate generated text files with rules that non-technical users can still read and review.

## Is the DSL final?

No. The current documentation describes the planned v1 direction and is expected to evolve as parser and engine work begins.

## Why Markdown?

Markdown keeps suites readable in editors, pull requests, documentation portals, and source control.

## Will TextUnitTest support CI systems?

Yes. CI friendliness is a core product goal, and the planned CLI is intended to work naturally in systems such as GitHub Actions and Azure DevOps.

## Does `Length:` count characters or bytes?

`Length:` uses **UTF-8 bytes**, which usually matches the file’s size on disk for a UTF-8 text file. Character counts can differ when the text includes emoji or other multi-byte Unicode sequences.

## How do I put quotes inside a string literal?

Use **three delimiter styles** (`"`, `'`, or `` ` ``) so you can pick one that avoids clashing with the text, or **escape** using **doubled delimiters** (`""`, `''`, `` `` ``) or **backslashes** (`\"`, `\'`, `` \` ``). See the language specification section **String literals**.
