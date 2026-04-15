import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { FUZZY_DEFAULT_TOLERANCE_PERCENT, fuzzyPhraseMatchesLineScope } from "../matching/fuzzy.js";
import { describeFormatFailure, formatSpecLabel, scopeHasFormatMatch } from "../matching/formats.js";
import { wildcardMatchesScope } from "../matching/wildcard.js";
import type { Rule, TestCaseAst, TestSuiteAst } from "../models/ast.js";
import {
  applyLocationWindow,
  fullFileLineText,
  lineNumberOneBased,
  lineOverlapsWindow,
  scopeLines,
  type ScopeWindow,
} from "./scope.js";

export interface TestRunResult {
  testName: string;
  passed: boolean;
  failures: string[];
  error?: string;
  /** True when the test was skipped due to a failing `If:` condition. */
  skipped?: boolean;
}

export interface SuiteRunResult {
  suiteTitle: string;
  results: TestRunResult[];
}

/**
 * Evaluate a single `If:` condition string against the provided params.
 * Supports:
 *   - `varName=value`  → true if params[varName] === value
 *   - `varName!=value` → true if params[varName] !== value
 *   - `varName`        → true if params[varName] is set and non-empty
 */
export function evaluateIfCondition(condition: string, params: Record<string, string>): boolean {
  const neqMatch = /^([^!=]+)!=(.*)$/.exec(condition);
  if (neqMatch) {
    const varName = neqMatch[1]!.trim();
    const expected = neqMatch[2]!;
    return (params[varName] ?? "") !== expected;
  }
  const eqMatch = /^([^!=]+)=(.*)$/.exec(condition);
  if (eqMatch) {
    const varName = eqMatch[1]!.trim();
    const expected = eqMatch[2]!;
    return (params[varName] ?? "") === expected;
  }
  // Plain variable name — truthy check
  const varName = condition.trim();
  const val = params[varName] ?? "";
  return val !== "" && val.toLowerCase() !== "false" && val !== "0";
}

/**
 * Evaluate all `If:` rules in a test case.
 * Returns `true` if the test should run, `false` if it should be skipped.
 */
function shouldRunTest(rules: Rule[], params: Record<string, string>): boolean {
  for (const r of rules) {
    if (r.kind === "if") {
      if (!evaluateIfCondition(r.condition, params)) {
        return false;
      }
    }
  }
  return true;
}

function isLocationRule(r: Rule): boolean {
  return (
    r.kind === "between" ||
    r.kind === "after" ||
    r.kind === "before" ||
    r.kind === "onLine" ||
    r.kind === "betweenLines"
  );
}

function isAssertionRule(r: Rule): boolean {
  switch (r.kind) {
    case "require":
    case "requireAnyOf":
    case "reject":
    case "rejectAnyOf":
    case "regex":
    case "rejectRegex":
    case "countLiteral":
    case "countLiteralAtLeast":
    case "countLiteralAtMost":
    case "countLiteralBetween":
    case "countRegex":
    case "countRegexAtLeast":
    case "countRegexAtMost":
    case "countRegexBetween":
    case "startsWith":
    case "endsWith":
    case "requirePattern":
    case "fuzzyRequire":
    case "requireFormat":
    case "rejectFormat":
    case "lineMustEqual":
    case "firstLineMustEqual":
    case "lastLineMustEqual":
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

export async function runSuite(suiteFilePath: string, suite: TestSuiteAst, params?: Record<string, string>): Promise<SuiteRunResult> {
  const baseDir = dirname(suiteFilePath);
  const resolvedParams = params ?? {};
  const results: TestRunResult[] = [];
  for (const test of suite.tests) {
    results.push(await runTestCase(baseDir, test, resolvedParams));
  }
  return { suiteTitle: suite.title, results };
}

async function runTestCase(baseDir: string, test: TestCaseAst, params: Record<string, string>): Promise<TestRunResult> {
  // Evaluate If: conditions before running the test.
  if (!shouldRunTest(test.rules, params)) {
    return { testName: test.name, passed: true, failures: [], skipped: true };
  }

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
    if (rule.kind === "target" || rule.kind === "fail" || rule.kind === "case" || rule.kind === "tolerance" || rule.kind === "if") {
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
    case "onLine":
      return `On Line: line ${loc.line} is outside the file or does not overlap the current scope`;
    case "betweenLines":
      return `Between Lines: lines ${loc.firstLine}–${loc.lastLine} are outside the file or do not overlap the current scope`;
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

/** Last line of scope ignoring trailing blank lines (so a final newline does not add an empty “last line”). */
function lastNonBlankLineText(scope: string): string {
  const lines = scopeLines(scope);
  for (let i = lines.length - 1; i >= 0; i--) {
    const L = lines[i]!;
    if (L.trim() !== "") {
      return L;
    }
  }
  return "";
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
    case "requireAnyOf": {
      const ok = rule.literals.some((lit) => literalIncludes(scope, lit, insensitive));
      return ok
        ? null
        : `Require Any Of: none of the options were found: ${rule.literals.map((l) => JSON.stringify(l)).join(", ")}. Line: ${line}`;
    }
    case "reject":
      return !literalIncludes(scope, rule.literal, insensitive)
        ? null
        : `Reject: forbidden text found: ${JSON.stringify(rule.literal)}. Line: ${line}`;
    case "rejectAnyOf": {
      for (const lit of rule.literals) {
        if (literalIncludes(scope, lit, insensitive)) {
          return `Reject Any Of: forbidden text found: ${JSON.stringify(lit)}. Line: ${line}`;
        }
      }
      return null;
    }
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
    case "countLiteralAtLeast": {
      const got = countLiteralOccurrences(scope, rule.literal, insensitive);
      return got >= rule.count
        ? null
        : `Count: expected at least ${rule.count} of ${JSON.stringify(rule.literal)}, found ${got}. Line: ${line}`;
    }
    case "countLiteralAtMost": {
      const got = countLiteralOccurrences(scope, rule.literal, insensitive);
      return got <= rule.count
        ? null
        : `Count: expected at most ${rule.count} of ${JSON.stringify(rule.literal)}, found ${got}. Line: ${line}`;
    }
    case "countLiteralBetween": {
      const got = countLiteralOccurrences(scope, rule.literal, insensitive);
      return got >= rule.min && got <= rule.max
        ? null
        : `Count: expected between ${rule.min} and ${rule.max} of ${JSON.stringify(rule.literal)}, found ${got}. Line: ${line}`;
    }
    case "countRegex": {
      const got = countRegexOccurrences(scope, rule.pattern, rule.flags, insensitive);
      return got === rule.count
        ? null
        : `Count: expected ${rule.count} matches for /${rule.pattern}/${rule.flags}, found ${got}. Line: ${line}`;
    }
    case "countRegexAtLeast": {
      const got = countRegexOccurrences(scope, rule.pattern, rule.flags, insensitive);
      return got >= rule.count
        ? null
        : `Count: expected at least ${rule.count} matches for /${rule.pattern}/${rule.flags}, found ${got}. Line: ${line}`;
    }
    case "countRegexAtMost": {
      const got = countRegexOccurrences(scope, rule.pattern, rule.flags, insensitive);
      return got <= rule.count
        ? null
        : `Count: expected at most ${rule.count} matches for /${rule.pattern}/${rule.flags}, found ${got}. Line: ${line}`;
    }
    case "countRegexBetween": {
      const got = countRegexOccurrences(scope, rule.pattern, rule.flags, insensitive);
      return got >= rule.min && got <= rule.max
        ? null
        : `Count: expected between ${rule.min} and ${rule.max} matches for /${rule.pattern}/${rule.flags}, found ${got}. Line: ${line}`;
    }
    case "startsWith": {
      const s = normalizeText(scope, insensitive);
      const p = normalizeText(rule.literal, insensitive);
      return s.startsWith(p)
        ? null
        : `Starts With: scope does not start with ${JSON.stringify(rule.literal)}. Line: ${line}`;
    }
    case "endsWith": {
      // Ignore trailing newlines on scope so files ending with \n still match the last line of text.
      const s = normalizeText(scope, insensitive).replace(/\r?\n+$/, "");
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
        : `Require Format: expected ${formatSpecLabel(rule.spec)}. ${describeFormatFailure(scope, rule.spec)} Line: ${line}`;
    case "rejectFormat":
      return !scopeHasFormatMatch(scope, rule.spec)
        ? null
        : `Reject Format: ${formatSpecLabel(rule.spec)} must not appear, but a match was found. Line: ${line}`;
    case "lineMustEqual": {
      const lt = fullFileLineText(fullContent, rule.line);
      if (lt === null) {
        return `Line Must Equal: line ${rule.line} does not exist in the file. Line: ${line}`;
      }
      if (!lineOverlapsWindow(fullContent, rule.line, win)) {
        return `Line Must Equal: line ${rule.line} is outside the current scope. Line: ${line}`;
      }
      const got = normalizeText(lt.trim(), insensitive);
      const exp = normalizeText(rule.literal.trim(), insensitive);
      return got === exp
        ? null
        : `Line Must Equal: line ${rule.line} was ${JSON.stringify(lt.trim())}, expected ${JSON.stringify(rule.literal.trim())}. Line: ${line}`;
    }
    case "firstLineMustEqual": {
      const lines = scopeLines(scope);
      const first = lines[0] ?? "";
      const got = normalizeText(first.trim(), insensitive);
      const exp = normalizeText(rule.literal.trim(), insensitive);
      return got === exp
        ? null
        : `First Line Must Equal: first line was ${JSON.stringify(first.trim())}, expected ${JSON.stringify(rule.literal.trim())}. Line: ${line}`;
    }
    case "lastLineMustEqual": {
      const last = lastNonBlankLineText(scope);
      const got = normalizeText(last.trim(), insensitive);
      const exp = normalizeText(rule.literal.trim(), insensitive);
      return got === exp
        ? null
        : `Last Line Must Equal: last non-blank line was ${JSON.stringify(last.trim())}, expected ${JSON.stringify(rule.literal.trim())}. Line: ${line}`;
    }
    default:
      return null;
  }
}
