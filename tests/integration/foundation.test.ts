import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSuite } from "../../src/engine/index.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

describe("TextUnitTest integration", () => {
  it("parses and passes examples/basic/basic-tests.md", async () => {
    const suitePath = join(repoRoot, "examples", "basic", "basic-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "basic-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/regex/regex-tests.md", async () => {
    const suitePath = join(repoRoot, "examples", "regex", "regex-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "regex-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/reports/report-tests.md", async () => {
    const suitePath = join(repoRoot, "examples", "reports", "report-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "report-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/quotes/quote-tests.md", async () => {
    const suitePath = join(repoRoot, "examples", "quotes", "quote-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "quote-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/invoices/invoice-tests.md", async () => {
    const suitePath = join(repoRoot, "examples", "invoices", "invoice-tests.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "invoice-tests.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/privacy/redaction-suite.md", async () => {
    const suitePath = join(repoRoot, "examples", "privacy", "redaction-suite.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "redaction-suite.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
  });

  it("parses and passes examples/contracts/contract-validation-suite.md", async () => {
    const suitePath = join(repoRoot, "examples", "contracts", "contract-validation-suite.md");
    const source = await readFile(suitePath, "utf8");
    const parsed = parseSuiteMarkdown(source, "contract-validation-suite.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results.every((r) => r.passed && !r.error)).toBe(true);
    expect(result.results.length).toBeGreaterThanOrEqual(40);
  });

  it("reports Require failure when text is missing", async () => {
    const md = `# T\n\n## One\n\nTarget: sample-output.txt\nRequire: "NOT IN FILE"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(repoRoot, "examples", "basic", "basic-tests.md");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
    expect(result.results[0]!.failures.length).toBeGreaterThan(0);
  });

  it("parses Length rules and evaluates UTF-8 byte length", async () => {
    const md = `# T\n\n## Size\n\nTarget: sample-output.txt\nLength: at least 1\nLength: at most 100000
`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(repoRoot, "examples", "basic", "basic-tests.md");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("fails Length when file is too small", async () => {
    const md = `# T\n\n## Size\n\nTarget: sample-output.txt\nLength: at least 999999\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(repoRoot, "examples", "basic", "basic-tests.md");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
    expect(result.results[0]!.failures.some((f) => f.includes("UTF-8 bytes"))).toBe(true);
  });
});
