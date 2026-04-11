# Roadmap

## Done (through 0.4.0)

- **Parser** — Markdown suites, headings, rule keys, string literals (three quote styles + escapes).
- **Engine** — Scope narrowing (`Between` / `After` / `Before` / **`On Line:`** / **`Between Lines:`**), assertions, UTF-8 `Length:` on whole files, **wildcard** / **fuzzy** / **format** matching.
- **CLI** — `textunittest validate` with optional `--html`.
- **Reporting** — Console summary and HTML report.
- **Examples** — `examples/*` covering basic, regex, reports, invoices, quotes, matching, a **large CRM contract** (`examples/contracts/`), and **privacy / PAN redaction** (`examples/privacy/`).
- **CI** — Single workflow runs build + tests on Node 20.
- **npm** — Package published as [`textunittest`](https://www.npmjs.com/package/textunittest); semver and [CHANGELOG](../CHANGELOG.md) track releases.

## Next

- Machine-readable reports (e.g. JUnit JSON) for CI dashboards.
- Configurable limits (e.g. wildcard `*` max span).
- Stricter or locale-aware format validators where needed.

## v1.0

Stable semver, documented compatibility guarantees, and changelog discipline for releases.
