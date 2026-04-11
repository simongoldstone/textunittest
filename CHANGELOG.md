# Changelog

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
