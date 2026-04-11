import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSuite } from "../../src/engine/index.js";
import { parseSuiteMarkdown } from "../../src/parser/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

describe("DSL extensions — parser", () => {
  it("parses Require Any Of with or", () => {
    const r = parseSuiteMarkdown(
      `# S\n## T\nTarget: x.txt\nRequire Any Of: "a" or "b" or "c"\n`,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "requireAnyOf");
    expect(rule?.kind === "requireAnyOf" && rule.literals).toEqual(["a", "b", "c"]);
  });

  it("parses Reject Any Of", () => {
    const r = parseSuiteMarkdown(`# S\n## T\nTarget: x.txt\nReject Any Of: "x" or "y"\n`);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rule = r.suite.tests[0]!.rules.find((x) => x.kind === "rejectAnyOf");
    expect(rule?.kind === "rejectAnyOf" && rule.literals).toEqual(["x", "y"]);
  });

  it("parses count at least, at most, between for literals and regex", () => {
    const md = `# S
## T
Target: x.txt
Count: at least 2 of "a"
Count: at most 9 of "b"
Count: between 1 and 4 of "c"
Count: at least 1 matches /foo/
Count: at most 3 matches /bar/
Count: between 0 and 2 matches /baz/
`;
    const r = parseSuiteMarkdown(md);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rules = r.suite.tests[0]!.rules;
    expect(rules.some((x) => x.kind === "countLiteralAtLeast" && x.count === 2)).toBe(true);
    expect(rules.some((x) => x.kind === "countLiteralAtMost" && x.count === 9)).toBe(true);
    expect(rules.some((x) => x.kind === "countLiteralBetween" && x.min === 1 && x.max === 4)).toBe(true);
    expect(rules.some((x) => x.kind === "countRegexAtLeast")).toBe(true);
    expect(rules.some((x) => x.kind === "countRegexAtMost")).toBe(true);
    expect(rules.some((x) => x.kind === "countRegexBetween")).toBe(true);
  });

  it("parses Line Must Equal, First/Last Line Must Equal, Reject Format", () => {
    const md = `# S
## T
Target: x.txt
Line Must Equal: 3 "hello"
First Line Must Equal: "A"
Last Line Must Equal: "Z"
Reject Format: Email
`;
    const r = parseSuiteMarkdown(md);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rules = r.suite.tests[0]!.rules;
    expect(rules.some((x) => x.kind === "lineMustEqual" && x.line === 3 && x.literal === "hello")).toBe(true);
    expect(rules.some((x) => x.kind === "firstLineMustEqual" && x.literal === "A")).toBe(true);
    expect(rules.some((x) => x.kind === "lastLineMustEqual" && x.literal === "Z")).toBe(true);
    expect(rules.some((x) => x.kind === "rejectFormat" && x.spec.kind === "email")).toBe(true);
  });

  it("ignores full-line HTML comments", () => {
    const md = `# S
## T
Target: x.txt
<!-- a comment -->
Require: "ok"
`;
    const r = parseSuiteMarkdown(md);
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    expect(r.suite.tests[0]!.rules.some((x) => x.kind === "require" && x.literal === "ok")).toBe(true);
  });
});

describe("DSL extensions — engine", () => {
  const fixtures = join(repoRoot, "tests", "fixtures");

  it("Require Any Of passes when one option exists", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nRequire Any Of: "alpha" or "beta" or "gamma"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("Reject Any Of fails when one forbidden phrase exists", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nReject Any Of: "zzz" or "alpha"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
  });

  it("count literal at least and between", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nCount: at least 2 of "x"\nCount: between 1 and 10 of "line"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("First Line and Line Must Equal", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-sample.txt\nFirst Line Must Equal: "line one"\nLine Must Equal: 2 "line two"\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(true);
  });

  it("Reject Format Email fails when email present", async () => {
    const md = `# S\n## T\nTarget: dsl-ext-email.txt\nReject Format: Email\n`;
    const parsed = parseSuiteMarkdown(md);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const suitePath = join(fixtures, "dsl-ext-suite-anchor.txt");
    const result = await runSuite(suitePath, parsed.suite);
    expect(result.results[0]!.passed).toBe(false);
  });
});
