import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSuite } from "../../src/engine/index.js";
import { applyLocationWindow, fullFileLineRange, fullFileLinesRange, type ScopeWindow } from "../../src/engine/scope.js";
import type { Rule } from "../../src/models/ast.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const fixturesDir = join(repoRoot, "tests", "fixtures");
/** `runSuite` resolves `Target:` relative to this path’s directory. */
const fixturesSuitePath = join(fixturesDir, "line-format-sample.txt");

describe("fullFileLineRange", () => {
  it("returns first line", () => {
    expect(fullFileLineRange("a\nb", 1)).toEqual({ start: 0, end: 1 });
  });
  it("returns second line", () => {
    expect(fullFileLineRange("a\nb", 2)).toEqual({ start: 2, end: 3 });
  });
  it("handles empty first line", () => {
    expect(fullFileLineRange("\n", 1)).toEqual({ start: 0, end: 0 });
  });
  it("returns null for line past EOF", () => {
    expect(fullFileLineRange("a", 2)).toBe(null);
  });
});

describe("fullFileLinesRange", () => {
  it("returns inclusive span for multiple lines", () => {
    expect(fullFileLinesRange("a\nb\nc", 1, 2)).toEqual({ start: 0, end: 3 });
  });
  it("returns null when last line missing", () => {
    expect(fullFileLinesRange("a", 1, 3)).toBe(null);
  });
});

describe("applyLocationWindow line rules", () => {
  const content = "a\nb\nc\n";
  const full: ScopeWindow = { scope: content, start: 0, end: content.length };

  it("On Line narrows to one line", () => {
    const loc: Rule = { kind: "onLine", line: 2 };
    const w = applyLocationWindow(content, full, loc, false);
    expect(w).toEqual({ scope: "b", start: 2, end: 3 });
  });

  it("Between Lines includes interior newlines", () => {
    const loc: Rule = { kind: "betweenLines", firstLine: 1, lastLine: 2 };
    const w = applyLocationWindow(content, full, loc, false);
    expect(w).toEqual({ scope: "a\nb", start: 0, end: 3 });
  });

  it("intersects with prior window (no overlap)", () => {
    const afterB: ScopeWindow = { scope: "c\n", start: 4, end: content.length };
    const loc: Rule = { kind: "onLine", line: 1 };
    const w = applyLocationWindow(content, afterB, loc, false);
    expect(w).toBe(null);
  });
});

describe("On Line and Between Lines parser", () => {
  it("parses On Line and Between Lines", () => {
    const md = `# S
## T
Target: x.txt
On Line: 12
Between Lines: 15 and 22
`;
    const r = parseSuiteMarkdown(md);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rules = r.suite.tests[0]!.rules;
    expect(rules.some((x) => x.kind === "onLine" && x.line === 12)).toBe(true);
    expect(
      rules.some((x) => x.kind === "betweenLines" && x.firstLine === 15 && x.lastLine === 22),
    ).toBe(true);
  });

  it("rejects invalid Between Lines order", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nBetween Lines: 5 and 3\n`);
    expect(r.ok).toBe(false);
  });
});

describe("line-scoped Require Format", () => {
  it("passes when a valid email appears on the given line", async () => {
    const md = `# Suite
## Email on line 3
Target: line-format-sample.txt
On Line: 3
Require Format: Email
`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(fixturesSuitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("passes when a valid date appears on the given line", async () => {
    const md = `# Suite
## Date on line 9
Target: line-format-sample.txt
On Line: 9
Require Format: Date(yyyy-mm-dd)
`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(fixturesSuitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("passes when a mask match appears within a line range", async () => {
    const md = `# Suite
## Code mask between lines 15 and 22
Target: line-format-sample.txt
Between Lines: 15 and 22
Require Format: Mask(AAAA-9999999)
`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(fixturesSuitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("fails when the format is on a different line than On Line", async () => {
    const md = `# Suite
## Wrong line
Target: line-format-sample.txt
On Line: 2
Require Format: Email
`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(fixturesSuitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
  });
});
