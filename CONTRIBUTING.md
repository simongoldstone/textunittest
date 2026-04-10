# Contributing to TextUnitTest

Thanks for your interest in improving TextUnitTest.

## Development Workflow

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make focused changes with clear commit messages.
4. Run local checks before opening a pull request.
5. Open a pull request that explains the intent, scope, and follow-up work.

## Branch Naming Suggestions

Use descriptive branch names that make review easier. Suggested prefixes:

- `docs/...` for documentation updates
- `chore/...` for repository maintenance
- `feat/...` for new features
- `fix/...` for bug fixes

## Pull Request Guidance

- Keep pull requests focused on a single concern whenever possible.
- Update documentation when behavior, structure, or contributor expectations change.
- Include examples or reasoning when you are evolving the DSL design.
- Note any future work that is intentionally out of scope for the current pull request.

## Local Checks

Install dependencies and run the current repository checks before submitting:

```bash
npm install
npm run build
npm test
```

## Code Style Expectations

- Prefer small, modular changes.
- Preserve strict TypeScript settings.
- Keep parser, engine, reporting, and CLI concerns clearly separated.
- Avoid introducing implementation logic into placeholder modules during specification-only phases unless the change explicitly targets implementation work.
