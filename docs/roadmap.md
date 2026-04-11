# Roadmap

## Done (current release)

- **Parser** — Markdown suites, headings, rule keys, string literals (three quote styles + escapes).
- **Engine** — Scope narrowing (`Between` / `After` / `Before`), assertions, UTF-8 `Length:` on whole files, **wildcard** / **fuzzy** / **format** matching.
- **CLI** — `textunittest validate` with optional `--html`.
- **Reporting** — Console summary and HTML report.
- **Examples** — `examples/*` covering basic, regex, reports, invoices, quotes, matching.
- **CI** — Single workflow runs build + tests on Node 20.

## Next

- Machine-readable reports (e.g. JUnit JSON) for CI dashboards.
- Configurable limits (e.g. wildcard `*` max span).
- Stricter or locale-aware format validators where needed.
- npm publish and versioning cadence.

## v1.0

Stable semver, documented compatibility guarantees, and changelog discipline for releases.
