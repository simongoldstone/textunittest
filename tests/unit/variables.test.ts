import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateIfCondition, runSuite } from "../../src/engine/index.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Parser — text interpolation
// ---------------------------------------------------------------------------

describe("external parameters — parser text interpolation", () => {
  it("substitutes a simple variable in Require:", () => {
    const params = { greeting: "hello" };
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nRequire: "{{greeting}}"\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "require");
    expect(rule?.kind === "require" && rule.literal).toBe("hello");
  });

  it("substitutes multiple variables in a single rule value", () => {
    const params = { first: "15", second: "22" };
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nBetween Lines: {{first}} and {{second}}\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "betweenLines");
    expect(rule?.kind === "betweenLines" && rule.firstLine).toBe(15);
    expect(rule?.kind === "betweenLines" && rule.lastLine).toBe(22);
  });

  it("leaves unknown placeholders unchanged (lenient substitution)", () => {
    const params = {};
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nRequire: "{{unknown}}"\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "require");
    expect(rule?.kind === "require" && rule.literal).toBe("{{unknown}}");
  });

  it("substitutes variables in Target: path", () => {
    const params = { dir: "reports", file: "output.txt" };
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: {{dir}}/{{file}}\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "target");
    expect(rule?.kind === "target" && rule.path).toBe("reports/output.txt");
  });

  it("substitutes variables in Reject:", () => {
    const params = { badWord: "ERROR" };
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nReject: "{{badWord}}"\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "reject");
    expect(rule?.kind === "reject" && rule.literal).toBe("ERROR");
  });

  it("works with no params (backward-compatible signature)", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nRequire: "ok"\n`);
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Parser — If: rule
// ---------------------------------------------------------------------------

describe("external parameters — parser If: rule", () => {
  it("parses If: {{switch=yes}} as an if condition", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nIf: {{switch=yes}}\n`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "if");
    expect(rule?.kind === "if" && rule.condition).toBe("switch=yes");
  });

  it("parses If: {{featureEnabled}} (truthy check)", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nIf: {{featureEnabled}}\n`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "if");
    expect(rule?.kind === "if" && rule.condition).toBe("featureEnabled");
  });

  it("parses If: {{mode!=debug}} (inequality)", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nIf: {{mode!=debug}}\n`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "if");
    expect(rule?.kind === "if" && rule.condition).toBe("mode!=debug");
  });

  it("rejects If: without {{ }} wrapper", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nIf: switch=yes\n`);
    expect(r.ok).toBe(false);
  });

  it("rejects If: with empty condition", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nIf: {{}}\n`);
    expect(r.ok).toBe(false);
  });

  it("does NOT substitute {{...}} in If: values (condition is parsed as-is)", () => {
    const params = { switch: "yes" };
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nIf: {{switch=yes}}\n`,
      undefined,
      params,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // The condition string must remain "switch=yes", not the resolved value
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "if");
    expect(rule?.kind === "if" && rule.condition).toBe("switch=yes");
  });
});

// ---------------------------------------------------------------------------
// Engine — evaluateIfCondition helper
// ---------------------------------------------------------------------------

describe("evaluateIfCondition", () => {
  it("varName=value returns true when they match", () => {
    expect(evaluateIfCondition("switch=yes", { switch: "yes" })).toBe(true);
  });

  it("varName=value returns false when they differ", () => {
    expect(evaluateIfCondition("switch=yes", { switch: "no" })).toBe(false);
  });

  it("varName=value returns false when variable is absent", () => {
    expect(evaluateIfCondition("switch=yes", {})).toBe(false);
  });

  it("varName!=value returns true when they differ", () => {
    expect(evaluateIfCondition("mode!=debug", { mode: "release" })).toBe(true);
  });

  it("varName!=value returns false when they match", () => {
    expect(evaluateIfCondition("mode!=debug", { mode: "debug" })).toBe(false);
  });

  it("varName!=value returns true when variable is absent", () => {
    expect(evaluateIfCondition("mode!=debug", {})).toBe(true);
  });

  it("plain varName returns true when set and non-empty", () => {
    expect(evaluateIfCondition("featureEnabled", { featureEnabled: "1" })).toBe(true);
  });

  it("plain varName returns false when absent", () => {
    expect(evaluateIfCondition("featureEnabled", {})).toBe(false);
  });

  it("plain varName returns false when set to empty string", () => {
    expect(evaluateIfCondition("flag", { flag: "" })).toBe(false);
  });

  it("plain varName returns false when set to 'false'", () => {
    expect(evaluateIfCondition("flag", { flag: "false" })).toBe(false);
  });

  it("plain varName returns false when set to '0'", () => {
    expect(evaluateIfCondition("flag", { flag: "0" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Engine — skipped tests via If: conditions
// ---------------------------------------------------------------------------

describe("external parameters — engine If: skipping", () => {
  const fixtures = join(repoRoot, "tests", "fixtures");
  const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");

  it("runs the test when If: condition is true", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{switch=yes}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { switch: "yes" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { switch: "yes" });
    expect(result.results[0]!.skipped).toBeFalsy();
    expect(result.results[0]!.passed).toBe(true);
  });

  it("skips the test when If: condition is false", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{switch=yes}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { switch: "no" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { switch: "no" });
    expect(result.results[0]!.skipped).toBe(true);
    expect(result.results[0]!.passed).toBe(true);
    expect(result.results[0]!.failures).toHaveLength(0);
  });

  it("skips the test when variable is absent", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{switch=yes}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.skipped).toBe(true);
  });

  it("skips the test when truthy check is false (variable absent)", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{runMe}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.skipped).toBe(true);
  });

  it("runs test when truthy variable is present", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{runMe}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { runMe: "1" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { runMe: "1" });
    expect(result.results[0]!.skipped).toBeFalsy();
    expect(result.results[0]!.passed).toBe(true);
  });

  it("skips using != condition when variable matches", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{env!=ci}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { env: "ci" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { env: "ci" });
    expect(result.results[0]!.skipped).toBe(true);
  });

  it("runs using != condition when variable does not match", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{env!=ci}}\nRequire: "alpha"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { env: "dev" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { env: "dev" });
    expect(result.results[0]!.skipped).toBeFalsy();
    expect(result.results[0]!.passed).toBe(true);
  });

  it("a skipped test still counts as passed (does not fail the suite)", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nIf: {{switch=no}}\nRequire: "NOTFOUND"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, { switch: "yes" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, { switch: "yes" });
    // switch=yes doesn't equal no, so skipped
    expect(result.results[0]!.skipped).toBe(true);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("text interpolation flows into engine via parser (e.g. dynamic literal)", async () => {
    const params = { needle: "alpha" };
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nRequire: "{{needle}}"\n`;
    const parsed = parseSuiteMarkdown(md, undefined, params);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await runSuite(suitePath, parsed.suite, params);
    expect(result.results[0]!.passed).toBe(true);
  });
});
