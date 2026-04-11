import { describe, expect, it } from "vitest";
import { parseSuiteMarkdown } from "../../src/parser/index.js";
import { parseOneDelimitedLiteral, scanDelimitedString } from "../../src/parser/strings.js";

describe("delimited string scanning", () => {
  it("parses doubling for double quotes", () => {
    expect(scanDelimitedString(`"a""b"`, 0).value).toBe(`a"b`);
  });

  it("parses empty double-quoted string", () => {
    expect(scanDelimitedString(`""`, 0).value).toBe("");
  });

  it("parses doubling for single quotes", () => {
    expect(scanDelimitedString(`'don''t'`, 0).value).toBe(`don't`);
  });

  it("parses doubling for backticks", () => {
    expect(scanDelimitedString("`a``b`", 0).value).toBe("a`b");
  });

  it("parses backslash escapes", () => {
    const input = ['"', "a", "\\", '"', "b", '"'].join("");
    expect(scanDelimitedString(input, 0).value).toBe(`a"b`);
  });

  it("rejects invalid backslash escape", () => {
    const input = ['"', "a", "\\", "z", '"'].join("");
    expect(() => scanDelimitedString(input, 0)).toThrow(/invalid escape/);
  });
});

describe("parseSuiteMarkdown quoting", () => {
  it("accepts single-quoted Require", () => {
    const r = parseSuiteMarkdown(
      `# S\n\n## T\n\nTarget: x.txt\nRequire: 'hello'\n`,
      "t.md",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rules = r.suite.tests[0]!.rules;
    const req = rules.find((x) => x.kind === "require");
    expect(req).toEqual({ kind: "require", literal: "hello" });
  });

  it("accepts backtick-quoted Require", () => {
    const md = `# S

## T

Target: x.txt
Require: \`a \`\` b\`
`;
    const r = parseSuiteMarkdown(md, "t.md");
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const rules = r.suite.tests[0]!.rules;
    const req = rules.find((x) => x.kind === "require");
    expect(req).toEqual({ kind: "require", literal: "a ` b" });
  });

  it("parses Between with mixed quote styles", () => {
    const r = parseSuiteMarkdown(
      `# S\n\n## T\n\nTarget: x.txt\nBetween: 'a' and "b"\n`,
      "t.md",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) {
      return;
    }
    const bet = r.suite.tests[0]!.rules.find((x) => x.kind === "between");
    expect(bet).toEqual({ kind: "between", start: "a", end: "b" });
  });
});

describe("parseOneDelimitedLiteral", () => {
  it("requires trailing junk to fail", () => {
    expect(() => parseOneDelimitedLiteral(`"a" b`, "X")).toThrow(/unexpected text/);
  });
});
