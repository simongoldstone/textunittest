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
- For releases, bump **semver** in `package.json` and `package-lock.json` (e.g. `npm version <new> --no-git-tag-version`), summarize changes in **[CHANGELOG.md](./CHANGELOG.md)** (new `## x.y.z` section at the top), and align version mentions in **[README.md](./README.md)** (**Latest release**), **[docs/index.md](./docs/index.md)** (**Release** line in **Status**), and **[docs/roadmap.md](./docs/roadmap.md)** (**Done (through x.y.z)**) when the version or publish story changes. If the DSL changed, update **[docs/language-specification.md](./docs/language-specification.md)**, **[docs/syntax-guide.md](./docs/syntax-guide.md)**, **[docs/matching-extensions-spec.md](./docs/matching-extensions-spec.md)**, and **[docs/quick-start.md](./docs/quick-start.md)** as needed, plus **examples/** under `examples/`.
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
