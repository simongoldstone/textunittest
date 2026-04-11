import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { FUZZY_DEFAULT_TOLERANCE_PERCENT, fuzzyPhraseMatchesLineScope } from "../matching/fuzzy.js";
import { formatSpecLabel, scopeHasFormatMatch } from "../matching/formats.js";
import { wildcardMatchesScope } from "../matching/wildcard.js";
import type { Rule, TestCaseAst, TestSuiteAst } from "../models/ast.js";
import { applyLocationWindow, lineNumberOneBased, type ScopeWindow } from "./scope.js";

export interface TestRunResult {
  testName: string;
  passed: boolean;
  failures: string[];
  error?: string;
}

export interface SuiteRunResult {
  suiteTitle: string;
  results: TestRunResult[];
}

function isLocationRule(r: Rule): boolean {
  return r.kind === "between" || r.kind === "after" || r.kind === "before";
}

function isAssertionRule(r: Rule): boolean {
  switch (r.kind) {
    case "require":
    case "reject":
    case "regex":
    case "rejectRegex":
    case "countLiteral":
    case "countRegex":
    case "startsWith":
    case "endsWith":
    case "requirePattern":
    case "fuzzyRequire":
    case "requireFormat":
      return true;
    default:
      return false;
  }
}

function isLengthRule(r: Rule): boolean {
  switch (r.kind) {
    case "lengthAtLeast":
    case "lengthAtMost":
    case "lengthExactly":
    case "lengthBetween":
      return true;
    default:
      return false;
  }
}

function utf8ByteLength(content: string): number {
  return Buffer.byteLength(content, "utf8");
}

function effectiveCaseInsensitive(rules: Rule[]): boolean {
  let insensitive = false;
  for (const r of rules) {
    if (r.kind === "case") {
      insensitive = r.mode === "insensitive";
    }
  }
  return insensitive;
}

function tolerancePercentBeforeIndex(rules: Rule[], index: number): number {
  let p = FUZZY_DEFAULT_TOLERANCE_PERCENT;
  for (let i = 0; i < index; i++) {
    const r = rules[i]!;
    if (r.kind === "tolerance") {
      p = r.percent;
    }
  }
  return p;
}

function getFailMessage(rules: Rule[]): string | undefined {
  let msg: string | undefined;
  for (const r of rules) {
    if (r.kind === "fail") {
      msg = r.message;
    }
  }
  return msg;
}

function withFailHint(failHint: string | undefined, detail: string): string {
  if (failHint) {
    return `${failHint} (${detail})`;
  }
  return detail;
}

export async function runSuite(suiteFilePath: string, suite: TestSuiteAst): Promise<SuiteRunResult> {
  const baseDir = dirname(suiteFilePath);
  const results: TestRunResult[] = [];
  for (const test of suite.tests) {
    results.push(await runTestCase(baseDir, test));
  }
  return { suiteTitle: suite.title, results };
}

async function runTestCase(baseDir: string, test: TestCaseAst): Promise<TestRunResult> {
  const targetRule = test.rules.find((r) => r.kind === "target");
  if (!targetRule || targetRule.kind !== "target") {
    return { testName: test.name, passed: false, failures: [], error: "missing Target:" };
  }

  const targetPath = resolve(baseDir, targetRule.path);
  let content: string;
  try {
    content = await readFile(targetPath, "utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      testName: test.name,
      passed: false,
      failures: [],
      error: `could not read "${targetPath}": ${msg}`,
    };
  }

  const insensitive = effectiveCaseInsensitive(test.rules);
  const failHint = getFailMessage(test.rules);

  let win: ScopeWindow = { scope: content, start: 0, end: content.length };
  const locations = test.rules.filter(isLocationRule);
  for (const loc of locations) {
    const next = applyLocationWindow(content, win, loc, insensitive);
    if (next === null) {
      return {
        testName: test.name,
        passed: false,
        failures: [withFailHint(failHint, locationFailureMessage(loc))],
      };
    }
    win = next;
  }

  const byteLength = utf8ByteLength(content);
  const failures: string[] = [];
  for (let ri = 0; ri < test.rules.length; ri++) {
    const rule = test.rules[ri]!;
    if (rule.kind === "target" || rule.kind === "fail" || rule.kind === "case" || rule.kind === "tolerance") {
      continue;
    }
    if (isLocationRule(rule)) {
      continue;
    }
    if (isLengthRule(rule)) {
      const err = evaluateLength(byteLength, rule);
      if (err) {
        failures.push(withFailHint(failHint, err));
      }
      continue;
    }
    if (isAssertionRule(rule)) {
      const err = evaluateAssertion(content, win, rule, insensitive, test.rules, ri);
      if (err) {
        failures.push(withFailHint(failHint, err));
      }
    }
  }

  return {
    testName: test.name,
    passed: failures.length === 0,
    failures,
  };
}

function locationFailureMessage(loc: Rule): string {
  switch (loc.kind) {
    case "between":
      return `Between: could not find start "${loc.start}" and end "${loc.end}" in scope`;
    case "after":
      return `After: could not find marker "${loc.marker}" in scope`;
    case "before":
      return `Before: could not find marker "${loc.marker}" in scope`;
    default:
      return "location rule failed";
  }
}

function normalizeText(text: string, insensitive: boolean): string {
  return insensitive ? text.toLowerCase() : text;
}

function countLiteralOccurrences(haystack: string, needle: string, insensitive: boolean): number {
  if (needle === "") {
    return 0;
  }
  const h = normalizeText(haystack, insensitive);
  const n = normalizeText(needle, insensitive);
  let count = 0;
  let pos = 0;
  while (true) {
    const i = h.indexOf(n, pos);
    if (i === -1) {
      break;
    }
    count++;
    pos = i + n.length;
  }
  return count;
}

function regexFlagsForSearch(pattern: string, flags: string, caseInsensitive: boolean): string {
  let f = flags.includes("g") ? flags : `${flags}g`;
  if (caseInsensitive && !f.includes("i")) {
    f += "i";
  }
  return f;
}

function countRegexOccurrences(text: string, pattern: string, flags: string, caseInsensitive: boolean): number {
  const f = regexFlagsForSearch(pattern, flags, caseInsensitive);
  const re = new RegExp(pattern, f);
  return [...text.matchAll(re)].length;
}

function regexMatches(text: string, pattern: string, flags: string, caseInsensitive: boolean): boolean {
  const f = regexFlagsForSearch(pattern, flags, caseInsensitive);
  const re = new RegExp(pattern, f);
  return re.test(text);
}

function literalIncludes(haystack: string, needle: string, insensitive: boolean): boolean {
  const h = normalizeText(haystack, insensitive);
  const n = normalizeText(needle, insensitive);
  return h.includes(n);
}

function evaluateLength(bytes: number, rule: Rule): string | null {
  switch (rule.kind) {
    case "lengthAtLeast":
      return bytes >= rule.bytes
        ? null
        : `Length: file is ${bytes} UTF-8 bytes, expected at least ${rule.bytes}`;
    case "lengthAtMost":
      return bytes <= rule.bytes
        ? null
        : `Length: file is ${bytes} UTF-8 bytes, expected at most ${rule.bytes}`;
    case "lengthExactly":
      return bytes === rule.bytes
        ? null
        : `Length: file is ${bytes} UTF-8 bytes, expected exactly ${rule.bytes}`;
    case "lengthBetween":
      return bytes >= rule.min && bytes <= rule.max
        ? null
        : `Length: file is ${bytes} UTF-8 bytes, expected between ${rule.min} and ${rule.max} (inclusive)`;
    default:
      return null;
  }
}

function evaluateAssertion(
  fullContent: string,
  win: ScopeWindow,
  rule: Rule,
  insensitive: boolean,
  allRules: Rule[],
  ruleIndex: number,
): string | null {
  const scope = win.scope;
  const line = lineNumberOneBased(fullContent, win.start);

  switch (rule.kind) {
    case "require":
      return literalIncludes(scope, rule.literal, insensitive)
        ? null
        : `Require: text not found: ${JSON.stringify(rule.literal)}. Line: ${line}`;
    case "reject":
      return !literalIncludes(scope, rule.literal, insensitive)
        ? null
        : `Reject: forbidden text found: ${JSON.stringify(rule.literal)}. Line: ${line}`;
    case "regex":
      return regexMatches(scope, rule.pattern, rule.flags, insensitive)
        ? null
        : `Regex: pattern did not match: /${rule.pattern}/${rule.flags}. Line: ${line}`;
    case "rejectRegex":
      return !regexMatches(scope, rule.pattern, rule.flags, insensitive)
        ? null
        : `Reject Regex: pattern matched but must not: /${rule.pattern}/${rule.flags}. Line: ${line}`;
    case "countLiteral": {
      const got = countLiteralOccurrences(scope, rule.literal, insensitive);
      return got === rule.count
        ? null
        : `Count: expected ${rule.count} of ${JSON.stringify(rule.literal)}, found ${got}. Line: ${line}`;
    }
    case "countRegex": {
      const got = countRegexOccurrences(scope, rule.pattern, rule.flags, insensitive);
      return got === rule.count
        ? null
        : `Count: expected ${rule.count} matches for /${rule.pattern}/${rule.flags}, found ${got}. Line: ${line}`;
    }
    case "startsWith": {
      const s = normalizeText(scope, insensitive);
      const p = normalizeText(rule.literal, insensitive);
      return s.startsWith(p)
        ? null
        : `Starts With: scope does not start with ${JSON.stringify(rule.literal)}. Line: ${line}`;
    }
    case "endsWith": {
      const s = normalizeText(scope, insensitive);
      const p = normalizeText(rule.literal, insensitive);
      return s.endsWith(p)
        ? null
        : `Ends With: scope does not end with ${JSON.stringify(rule.literal)}. Line: ${line}`;
    }
    case "requirePattern":
      return wildcardMatchesScope(scope, rule.pattern, insensitive)
        ? null
        : `Require Pattern: no line matched ${JSON.stringify(rule.pattern)} (wildcards * and ? are single-line, non-greedy). Line: ${line}`;
    case "fuzzyRequire": {
      const tol = tolerancePercentBeforeIndex(allRules, ruleIndex);
      return fuzzyPhraseMatchesLineScope(scope, rule.phrase, tol, insensitive)
        ? null
        : `Fuzzy Require: no line reached ${tol}% similarity to ${JSON.stringify(rule.phrase)} (±30% length windows). Line: ${line}`;
    }
    case "requireFormat":
      return scopeHasFormatMatch(scope, rule.spec)
        ? null
        : `Require Format: no match for ${formatSpecLabel(rule.spec)}. Line: ${line}`;
    default:
      return null;
  }
}
