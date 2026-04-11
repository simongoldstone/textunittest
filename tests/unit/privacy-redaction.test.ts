import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSuite } from "../../src/engine/index.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

/** Patterns aligned with examples/privacy/redaction-suite.md */
const PAN_PATTERNS = [
  { name: "contiguous 16", re: /\b\d{16}\b/ },
  { name: "dashed 4-4-4-4", re: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/ },
  { name: "spaced 4-4-4-4", re: /\b\d{4} \d{4} \d{4} \d{4}\b/ },
  { name: "optional sep between groups", re: /\b(?:\d{4}[- ]?){3}\d{4}\b/ },
  { name: "strict separators only", re: /\b\d{4}(?:[- ]\d{4}){3}\b/ },
] as const;

describe("privacy PAN regexes match known bad strings", () => {
  const cases: { label: string; text: string; shouldMatch: string[] }[] = [
    {
      label: "contiguous test PAN",
      text: "card=4111111111111111 end",
      shouldMatch: ["contiguous 16", "optional sep between groups"],
    },
    {
      label: "dashed",
      text: "Pan 5500-0000-0000-0004 here",
      shouldMatch: ["dashed 4-4-4-4", "optional sep between groups", "strict separators only"],
    },
    {
      label: "spaced",
      text: "x 5500 0000 0000 0004 y",
      shouldMatch: ["spaced 4-4-4-4", "optional sep between groups", "strict separators only"],
    },
    {
      label: "mixed separators",
      text: "bad 4111-1111 1111-1111 ok",
      shouldMatch: ["optional sep between groups", "strict separators only"],
    },
  ];

  for (const { label, text, shouldMatch } of cases) {
    it(`matches expected patterns for ${label}`, () => {
      for (const p of PAN_PATTERNS) {
        const matched = p.re.test(text);
        const expectMatch = shouldMatch.includes(p.name);
        expect(matched).toBe(expectMatch);
      }
    });
  }
});

describe("privacy regexes do not match safe export example", () => {
  it("safe-export.txt has no PAN matches for suite patterns", async () => {
    const path = join(repoRoot, "examples", "privacy", "safe-export.txt");
    const text = await readFile(path, "utf8");
    for (const p of PAN_PATTERNS) {
      expect(p.re.test(text)).toBe(false);
    }
  });
});

describe("privacy suite fails when leak sample contains PAN shapes", () => {
  it("fails Reject Regex when file includes dashed test PAN", async () => {
    const suitePath = join(repoRoot, "tests", "fixtures", "privacy-leak-suite.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "privacy-leak-suite.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
    expect(result.results[0]!.failures.some((f) => f.includes("Reject Regex"))).toBe(true);
  });
});
