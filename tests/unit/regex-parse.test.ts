import { describe, expect, it } from "vitest";
import { parseSuiteMarkdown } from "../../src/parser/index.js";
import { runSuite } from "../../src/engine/index.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

describe("slash regex parsing", () => {
  it("preserves \\d, \\s, and similar escapes in Regex:", async () => {
    const md = `# S
## T
Target: regex-output.txt
Regex: /Build ID: \\d+/
`;
    const parsed = parseSuiteMarkdown(md, "t.md");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(repoRoot, "examples", "regex", "regex-tests.md");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });
});
