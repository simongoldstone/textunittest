# CI Integration

TextUnitTest fits into pipelines that validate generated text after a build or export step.

## Requirements

- **Node.js 20+** (matches `engines` in `package.json` and the GitHub Actions workflow).
- Run **`npm ci`** (or `npm install`) then **`npm run build`** then **`npm test`** to verify the package; for *your* assets, run **`npx textunittest validate …`** after the text is produced.

## GitHub Actions

This repository uses a **single workflow** (`.github/workflows/ci.yml`) that:

1. Checks out the repo  
2. Sets up Node 20 with npm cache  
3. Runs `npm ci`  
4. Runs `npm run build`  
5. Runs `npm test`  

Replicate the same steps in your workflow. Example:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
- run: npm ci
- run: npm run build
- run: npm test
```

If you install TextUnitTest from npm (`npm install textunittest`) or build it in-repo:

```yaml
- run: npm run build
- run: npx textunittest validate path/to/suites
```

Use `--html report.html` and upload the artifact if you want a human-readable report.

## Azure DevOps

Same idea: use a Node 20 task, `npm ci`, build, then `npx textunittest validate` (or `node` path to `dist/cli/index.js`).

## Notes

- Keep suite `.md` files next to the assets they validate (or use paths relative to each suite).
- Use **`Fail:`** for messages non-technical reviewers will see in logs.
- Run validation **after** the step that generates the text under test.
