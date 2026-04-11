# TextUnitTest Documentation

## Documents

- [Language specification](./language-specification.md) — full rule reference (all `Key:` rules)
- [Syntax guide](./syntax-guide.md) — how to write suites
- [Quick start](./quick-start.md) — workflow from scratch
- [Matching extensions (wildcards, fuzzy, formats)](./matching-extensions-spec.md)
- [CI integration](./ci-integration.md)
- [Roadmap](./roadmap.md)
- [FAQ](./faq.md)
- [Privacy / redaction (card-like patterns)](./privacy-redaction.md) — `Reject Regex` for PAN-shaped output
- [Changelog](../CHANGELOG.md) — release notes and version history (also at repo root)

## Status

**Release 0.5.0** — The parser, execution engine, CLI, and reporting described in these docs are **implemented** and published on npm as `textunittest`. This release adds **reader-friendly** rules (`Require Any Of:`, `Reject Any Of:`, extended `Count:`, `Line Must Equal:`, `First Line Must Equal:`, `Last Line Must Equal:`, `Reject Format:`), HTML comments in suites, and the **`examples/reader-friendly/`** demo. See the [changelog](../CHANGELOG.md) for full notes. The language may continue to evolve in minor ways; see the [roadmap](./roadmap.md) for planned extensions.
