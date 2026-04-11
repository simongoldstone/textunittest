# Changelog

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
