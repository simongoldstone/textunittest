# Contributing to TextUnitTest

Thanks for your interest in improving TextUnitTest.

## Development workflow

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make focused changes with clear commit messages.
4. Run local checks before opening a pull request (see below).
5. Open a pull request that explains the intent, scope, and any follow-up work.

## Branch naming

Suggested prefixes:

- `docs/...` — documentation
- `chore/...` — maintenance
- `feat/...` — features
- `fix/...` — bug fixes

## Pull requests

- Keep PRs focused when possible.
- Update **documentation** and **examples** when behavior or the DSL changes.
- Note any intentional out-of-scope follow-ups.

## Local checks

**Node.js 20+** is required (`node -v`). If you use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows), run `nvm use` in the repo root (see [`.nvmrc`](./.nvmrc)).

```bash
npm install
npm run build
npm test
```

During development you can use **`npm run test:watch`** for Vitest in watch mode.

## Code style

- Prefer small, focused changes.
- Preserve **strict TypeScript** (`tsconfig.json`).
- Keep **parser**, **engine**, **matching**, **reporting**, and **CLI** responsibilities separated.
