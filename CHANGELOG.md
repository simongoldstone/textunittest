# Changelog

## 0.5.0

- **Reader-friendly rules (non-technical wording)** — **`Require Any Of:`** / **`Reject Any Of:`** (quoted options separated by **`or`**), **`Count:`** with **at least**, **at most**, and **between** (for literals and regex matches), **`Line Must Equal:`**, **`First Line Must Equal:`**, **`Last Line Must Equal:`** (last ignores trailing blank lines), **`Reject Format:`** (inverse of **`Require Format:`**).
- **Suite HTML comments** — full-line `<!-- ... -->` ignored by the parser.
- Example **`examples/reader-friendly/`**, unit tests **`tests/unit/dsl-extensions.test.ts`**, documentation updates across **`docs/`** (language specification, syntax guide, quick start, index, roadmap, FAQ, matching extensions), **README.md**, and **CONTRIBUTING.md** (release checklist).

## 0.4.0

- **Privacy / redaction** — Example suite `examples/privacy/redaction-suite.md` with multiple **`Reject Regex:`** patterns for 16-digit PAN-shaped strings (contiguous, dashed, spaced, optional or strict group separators). Documentation in `docs/privacy-redaction.md`; unit tests in `tests/unit/privacy-redaction.test.ts`.
- **CRM contract example** — Large realistic `examples/contracts/crm-generated-service-agreement.txt` (CRM-style Master Service Agreement) and **`examples/contracts/contract-validation-suite.md`** with many tests (including several **`Between Lines:`** checks alongside markers and formats).

## 0.3.0

- **`On Line:`** and **`Between Lines:`** — narrow the assertion scope to one line or an inclusive line range (1-based, full-file line numbers); combine with **`Require Format:`** (and other assertions) to require a valid email, date, mask match, etc. on a specific line or range.

## 0.2.0

- Documentation aligned with the implemented parser, engine, CLI, and matching extensions.
- Consolidated GitHub Actions CI (build + test on Node 20).
- Richer **`Require Format:`** failure messages via `describeFormatFailure`.
- Package scripts: `test` runs Vitest once; `test:watch` for development.
- README and contributor docs updated for open-source use.

## 0.1.0

- Initial public foundation: DSL specs, examples, TypeScript layout.
