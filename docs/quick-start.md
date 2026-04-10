# Quick Start

This quick start walks through the intended TextUnitTest workflow.

## 1. Create a Text File

Create a text file that you want to validate.

Example:

```text
Welcome to Example Corp
Version: 2026.1
Copyright 2026 Example Corp
```

## 2. Create a Markdown Test Suite

Create a Markdown file beside the target file.

Example:

```md
# Invoice Validation Suite

## Ensure version number exists

Target: invoice.txt
Require: "Version:"
Between: "Welcome" and "Copyright"
Fail: Version number missing from header
```

## 3. Run the Validation Command

Planned CLI usage:

```bash
textunittest validate tests/
```

## 4. Add It to Automation

TextUnitTest is designed to be CI-friendly, so the same command can eventually run in local checks, GitHub Actions, Azure DevOps, or other automation systems.

## Current Limitation

This repository is currently in the specification phase. The CLI, parser, and engine are scaffolded for future implementation but are not functional yet.
