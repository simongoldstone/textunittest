import { describe, expect, it } from "vitest";
import { wildcardMatchesScope } from "../../src/matching/wildcard.js";
import { fuzzyPhraseMatchesLineScope, similarityPercent } from "../../src/matching/fuzzy.js";
import { scopeHasFormatMatch } from "../../src/matching/formats.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";
import { runSuite } from "../../src/engine/index.js";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

describe("wildcard", () => {
  it("matches single line non-greedy span", () => {
    expect(wildcardMatchesScope("A cat dog mouse B", "A * B", false)).toBe(true);
  });

  it("does not cross newlines", () => {
    expect(wildcardMatchesScope("A\nB", "A * B", false)).toBe(false);
  });

  it("matches ? exactly four times", () => {
    expect(wildcardMatchesScope("INV-1234", "INV-????", false)).toBe(true);
    expect(wildcardMatchesScope("INV-123", "INV-????", false)).toBe(false);
  });
});

describe("fuzzy", () => {
  it("detects near miss spelling", () => {
    const line = "Operation completed succesfully";
    const phrase = "Operation completed successfully";
    expect(similarityPercent(line, phrase)).toBeGreaterThan(85);
    expect(fuzzyPhraseMatchesLineScope(line, phrase, 85, false)).toBe(true);
  });

  it("rejects when below tolerance", () => {
    expect(fuzzyPhraseMatchesLineScope("totally different text here", "Operation completed successfully", 90, false)).toBe(
      false,
    );
  });
});

describe("formats", () => {
  it("validates dd-mm-yyyy calendar", () => {
    expect(
      scopeHasFormatMatch("x 25-12-2026 y", { kind: "date", dateFormat: "dd-mm-yyyy" }),
    ).toBe(true);
    expect(
      scopeHasFormatMatch("x 31-02-2026 y", { kind: "date", dateFormat: "dd-mm-yyyy" }),
    ).toBe(false);
  });

  it("matches email", () => {
    expect(scopeHasFormatMatch("a john@example.com b", { kind: "email" })).toBe(true);
  });
});

describe("examples/matching integration", () => {
  it("runs matching-tests.md successfully", async () => {
    const suitePath = join(repoRoot, "examples", "matching", "matching-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "matching-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });
});
