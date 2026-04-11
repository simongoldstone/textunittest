import { describe, expect, it } from "vitest";
import { parseSuiteMarkdown } from "../../src/parser/index.js";
import { runSuite } from "../../src/engine/index.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

describe("parser edge cases", () => {
  it("rejects suite without a level-one title", () => {
    const r = parseSuiteMarkdown("## Only h2\n\n## T\n\nTarget: x.txt\nRequire: \"a\"\n");
    expect(r.ok).toBe(false);
  });

  it("rejects Fuzzy Require phrase shorter than 5 characters", () => {
    const r = parseSuiteMarkdown(
      "# S\n\n## T\n\nTarget: x.txt\nFuzzy Require: \"1234\"\n",
      "x.md",
    );
    expect(r.ok).toBe(false);
  });

  it("rejects Tolerance outside 50–100", () => {
    const r = parseSuiteMarkdown("# S\n\n## T\n\nTarget: x.txt\nTolerance: 40%\n", "x.md");
    expect(r.ok).toBe(false);
  });
});

describe("engine edge cases", () => {
  it("includes format hint when Require Format fails", async () => {
    const md = `# S

## T

Target: sample-output.txt
Require Format: Email
`;
    const suitePath = join(repoRoot, "examples", "basic", "basic-tests.md");
    const parsed = parseSuiteMarkdown(md, "t.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
    const f = result.results[0]!.failures.join(" ");
    expect(f).toContain("Require Format:");
    expect(f).toContain("Line:");
    expect(f.length).toBeGreaterThan(50);
  });
});
