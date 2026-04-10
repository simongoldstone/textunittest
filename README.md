# TextUnitTest

Human-readable Markdown unit testing for generated text files.

TextUnitTest is a Markdown-based DSL and CLI for validating text output with readable, English-like rules. It is designed for teams that need confidence in generated files without forcing every reviewer or stakeholder to learn a programming test framework.

## Why TextUnitTest

Generated text files often need lightweight validation in release pipelines, document workflows, and content generation systems. TextUnitTest aims to make those checks accessible to non-technical users while still fitting naturally into CI/CD automation.

It is built around a few simple ideas:

- Non-technical users should be able to read and write tests.
- Validation rules should look like plain English instead of code.
- Test suites should live in version control and run cleanly in CI.

## Example

```md
# Invoice Validation Suite

## Ensure version number exists

Target: invoice.txt
Require: "Version:"
Between: "Welcome" and "Copyright"
Fail: Version number missing from header
```

## Installation

```bash
npm install -g textunittest
```

## Planned CLI Usage

```bash
textunittest validate tests/
```

## Phase 1 Scope

This repository currently provides:

- The public open-source repository foundation
- The initial DSL and Markdown syntax specification
- Example suites and sample target files
- TypeScript project scaffolding for future implementation
- CI workflow skeletons for build and test automation

This phase intentionally does not include parser, execution engine, or reporting logic yet.

## Documentation

- [Project documentation](./docs/index.md)
- [Language specification](./docs/language-specification.md)
- [Syntax guide](./docs/syntax-guide.md)
- [Quick start](./docs/quick-start.md)
- [CI integration](./docs/ci-integration.md)
- [Roadmap](./docs/roadmap.md)
- [FAQ](./docs/faq.md)

## Repository Layout

```text
docs/       Product and language documentation
examples/   Sample text files and Markdown validation suites
src/        Placeholder TypeScript source structure
tests/      Placeholder test directories and repository smoke test
```

## Project Status

Early development - specification phase.

The current goal is to establish a polished, contributor-friendly open-source foundation that can support parser and engine work in later milestones.

## Contributing

Contributions are welcome. Please start with [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

TextUnitTest is released under the [MIT License](./LICENSE).
