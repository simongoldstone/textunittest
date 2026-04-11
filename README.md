# TextUnitTest

Human-readable **Markdown** suites for validating **plain text** output—readable rules for reviewers, runnable checks in CI.

**Latest release:** 0.5.0 ([changelog](./CHANGELOG.md)).

## Features

- **DSL**: `#` suite title, `##` test names, `Key: value` rules (`Target:`, `Require:`, `Require Any Of:`, `Count:` ranges, `Line Must Equal:`, `First Line Must Equal:`, `Between:`, `On Line:`, `Between Lines:`, `Regex:`, `Reject Format:`, `Length:`, …).
- **String literals** with `"`, `'`, or `` ` `` plus escaping (doubling or `\`).
- **Matching extensions**: wildcards (`Require Pattern:`), fuzzy text (`Fuzzy Require:` + `Tolerance:`), structured formats (`Require Format:`) without writing regex by hand.
- **CLI**: `validate` on `.md` suite files or directories; optional **HTML** report.
- **Library API**: parse suites and run them from TypeScript (`parseSuiteMarkdown`, `runSuite`, …).

## Requirements

- **Node.js 20+** (see `engines` in `package.json`). Older Node versions are not supported (Vitest and tooling expect modern runtimes).

## Quick start (from a clone)

```bash
npm install
npm run build
npx textunittest validate examples/basic
```

Run **all** example suites:

```bash
npx textunittest validate examples
```

HTML report:

```bash
npx textunittest validate examples --html report.html
```

Exit code **0** when every test passes, **1** on failure or error—suitable for CI.

## Using the published package

```bash
npm install textunittest
npx textunittest validate ./tests
```

From a **clone** without installing globally, use **`npx textunittest`** after `npm run build`, or **`node dist/cli/index.js validate …`**.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/index.md](./docs/index.md) | Doc index |
| [docs/language-specification.md](./docs/language-specification.md) | Full rule reference |
| [docs/syntax-guide.md](./docs/syntax-guide.md) | How to write suites |
| [docs/quick-start.md](./docs/quick-start.md) | Step-by-step workflow |
| [docs/matching-extensions-spec.md](./docs/matching-extensions-spec.md) | Wildcards, fuzzy, formats |
| [docs/ci-integration.md](./docs/ci-integration.md) | GitHub Actions and automation |
| [docs/faq.md](./docs/faq.md) | FAQ |
| [docs/roadmap.md](./docs/roadmap.md) | What’s done and what’s next |
| [docs/privacy-redaction.md](./docs/privacy-redaction.md) | Block card-like numbers in output (`Reject Regex`) |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes (semver history) |

## Repository layout

```text
docs/       Product and language documentation
examples/   Sample suites and targets (reader-friendly rules, contracts, privacy/redaction, …)
src/        Parser, engine, matching, CLI, reporting
tests/      Unit and integration tests
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

[MIT](./LICENSE)
