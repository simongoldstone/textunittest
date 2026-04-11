# Quick Start

## 1. Prerequisites

- [Node.js](https://nodejs.org/) **20 or later** (`node -v`).
- Clone the repo and install dependencies:

```bash
npm install
npm run build
```

## 2. Create a text file

Example: `output.txt` with the content you want to validate.

## 3. Create a Markdown suite beside it

Example `checks.md`:

```md
# My checks

## Version line exists

Target: output.txt
Require: "Version:"
```

`Target:` paths are resolved **relative to the `.md` file** that contains them.

## 4. Run validation

From the directory that contains your suite (or pass a path):

```bash
npx textunittest validate checks.md
```

Or validate a **folder** (all `*.md` files under it, recursively):

```bash
npx textunittest validate ./tests
```

Optional HTML report:

```bash
npx textunittest validate ./tests --html report.html
```

Exit code **0** when all tests pass, **1** otherwise.

## 5. Try the bundled examples

```bash
npx textunittest validate examples/basic
npx textunittest validate examples
```

## 6. String literals

Rules such as `Require:` accept `"`, `'`, or `` ` `` delimiters. Use **doubled** delimiters (`""`, `''`, doubled backticks) or **backslash** escapes (`\"`, `\'`, `` \` ``). See [Language specification — String literals](./language-specification.md#string-literals).

## 7. Automation

Use the same command in GitHub Actions, Azure DevOps, or any CI that provides Node 20+. See [CI integration](./ci-integration.md).
