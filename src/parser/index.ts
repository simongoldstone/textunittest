import type { CaseMode, Rule, TestCaseAst, TestSuiteAst } from "../models/ast.js";
import type { DateFormatId, RequireFormatSpec } from "../models/format.js";
import {
  FUZZY_MAX_TOLERANCE,
  FUZZY_MIN_PHRASE_LENGTH,
  FUZZY_MIN_TOLERANCE,
} from "../matching/fuzzy.js";
import { parseOneDelimitedLiteral, parsePathValue, scanDelimitedString } from "./strings.js";

export { isStringDelimiter, parseOneDelimitedLiteral, parsePathValue, scanDelimitedString } from "./strings.js";

export interface ParseSuccess {
  ok: true;
  suite: TestSuiteAst;
}

export interface ParseFailure {
  ok: false;
  errors: string[];
}

export type ParseResult = ParseSuccess | ParseFailure;

const KEY_ORDER: readonly string[] = [
  "Fuzzy Require:",
  "Require Pattern:",
  "Require Format:",
  "Reject Regex:",
  "Starts With:",
  "Ends With:",
  "Between:",
  "Length:",
  "Count:",
  "Target:",
  "Require:",
  "Reject:",
  "Regex:",
  "After:",
  "Before:",
  "Fail:",
  "Case:",
  "Tolerance:",
];

export function parseSuiteMarkdown(source: string, filename?: string): ParseResult {
  const errors: string[] = [];
  const prefix = filename ? `${filename}: ` : "";

  const lines = source.split(/\r?\n/);
  let suiteTitle = "";
  let currentTest: TestCaseAst | null = null;
  const tests: TestCaseAst[] = [];

  const flushTest = (): void => {
    if (currentTest) {
      tests.push(currentTest);
      currentTest = null;
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]!;
    const trimmed = line.trim();

    if (trimmed.startsWith("#")) {
      const level = headingLevel(trimmed);
      if (level === 1) {
        flushTest();
        suiteTitle = trimmed.slice(1).trim();
        continue;
      }
      if (level === 2) {
        flushTest();
        currentTest = { name: trimmed.slice(2).trim(), rules: [] };
        continue;
      }
      if (level > 0) {
        errors.push(`${prefix}line ${lineIndex + 1}: unsupported heading depth (only # and ## are supported)`);
        continue;
      }
    }

    if (trimmed === "" || trimmed.startsWith("```")) {
      continue;
    }

    if (currentTest === null) {
      errors.push(`${prefix}line ${lineIndex + 1}: rule must appear under a ## test heading`);
      continue;
    }

    try {
      const rule = parseRuleLine(trimmed);
      if (rule !== null) {
        currentTest.rules.push(rule);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${prefix}line ${lineIndex + 1}: ${msg}`);
    }
  }

  flushTest();

  if (suiteTitle === "") {
    errors.push(`${prefix}missing or empty suite title (# heading)`);
  }

  for (const t of tests) {
    const targets = t.rules.filter((r) => r.kind === "target");
    if (targets.length === 0) {
      errors.push(`${prefix}test "${t.name}": missing Target:`);
    } else if (targets.length > 1) {
      errors.push(`${prefix}test "${t.name}": must have exactly one Target:`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    suite: { title: suiteTitle, tests },
  };
}

function headingLevel(line: string): number {
  let n = 0;
  while (n < line.length && line[n] === "#") {
    n++;
  }
  if (n > 0 && n < line.length && line[n] === " ") {
    return n;
  }
  return 0;
}

function parseRuleLine(line: string): Rule | null {
  for (const key of KEY_ORDER) {
    if (line.startsWith(key)) {
      const value = line.slice(key.length).trim();
      return parseRuleValue(key, value);
    }
  }
  throw new Error(`unrecognized rule (expected one of: ${KEY_ORDER.join(", ")})`);
}

function parseRuleValue(key: string, value: string): Rule {
  switch (key) {
    case "Target:":
      return { kind: "target", path: parsePathValue(value) };
    case "Fail:":
      return { kind: "fail", message: value };
    case "Case:":
      return { kind: "case", mode: parseCaseMode(value) };
    case "Require:":
      return { kind: "require", literal: parseOneDelimitedLiteral(value, "Require") };
    case "Reject:":
      return { kind: "reject", literal: parseOneDelimitedLiteral(value, "Reject") };
    case "Regex:":
      return parseSlashRegex(value, "regex");
    case "Reject Regex:":
      return parseSlashRegex(value, "rejectRegex");
    case "After:":
      return { kind: "after", marker: parseOneDelimitedLiteral(value, "After") };
    case "Before:":
      return { kind: "before", marker: parseOneDelimitedLiteral(value, "Before") };
    case "Starts With:":
      return { kind: "startsWith", literal: parseOneDelimitedLiteral(value, "Starts With") };
    case "Ends With:":
      return { kind: "endsWith", literal: parseOneDelimitedLiteral(value, "Ends With") };
    case "Between:":
      return parseBetween(value);
    case "Count:":
      return parseCount(value);
    case "Length:":
      return parseLength(value);
    case "Require Pattern:":
      return { kind: "requirePattern", pattern: parseOneDelimitedLiteral(value, "Require Pattern") };
    case "Fuzzy Require:": {
      const phrase = parseOneDelimitedLiteral(value, "Fuzzy Require");
      if (phrase.length < FUZZY_MIN_PHRASE_LENGTH) {
        throw new Error(`Fuzzy Require: phrase must be at least ${FUZZY_MIN_PHRASE_LENGTH} characters`);
      }
      return { kind: "fuzzyRequire", phrase };
    }
    case "Require Format:":
      return { kind: "requireFormat", spec: parseRequireFormat(value) };
    case "Tolerance:":
      return parseTolerance(value);
    default:
      throw new Error(`internal: unknown rule key ${key}`);
  }
}

function parseTolerance(value: string): Rule {
  const t = value.trim().replace(/%$/, "");
  const n = Number(t);
  if (!Number.isInteger(n) || n < FUZZY_MIN_TOLERANCE || n > FUZZY_MAX_TOLERANCE) {
    throw new Error(`Tolerance: expected ${FUZZY_MIN_TOLERANCE}%–${FUZZY_MAX_TOLERANCE}% (e.g. 90 or 90%)`);
  }
  return { kind: "tolerance", percent: n };
}

function parseRequireFormat(value: string): RequireFormatSpec {
  const t = value.trim();
  const low = t.toLowerCase();
  if (low === "email") {
    return { kind: "email" };
  }
  if (low === "integer") {
    return { kind: "integer" };
  }
  if (low === "decimal") {
    return { kind: "decimal" };
  }
  if (low === "uuid") {
    return { kind: "uuid" };
  }
  if (low === "ukpostcode") {
    return { kind: "ukPostcode" };
  }

  const dateM = /^Date\(\s*(dd-mm-yyyy|dd\/mm\/yyyy|yyyy-mm-dd|mm-dd-yyyy)\s*\)$/i.exec(t);
  if (dateM) {
    const id = normalizeDateFormatId(dateM[1]!);
    return { kind: "date", dateFormat: id };
  }

  const phoneM = /^Phone\(([\s\S]*)\)\s*$/i.exec(t);
  if (phoneM) {
    return { kind: "phone", mask: phoneM[1]!.trim() };
  }

  const curM = /^Currency\(([\s\S]*)\)\s*$/i.exec(t);
  if (curM) {
    return { kind: "currency", symbol: curM[1]! };
  }

  const maskM = /^Mask\(([\s\S]*)\)\s*$/i.exec(t);
  if (maskM) {
    return { kind: "customMask", mask: maskM[1]! };
  }

  throw new Error(
    `Require Format: unknown built-in (try Email, UUID, Date(dd-mm-yyyy), Phone(...), Mask(...), etc.)`,
  );
}

function normalizeDateFormatId(raw: string): DateFormatId {
  const s = raw.toLowerCase();
  if (s === "dd-mm-yyyy") {
    return "dd-mm-yyyy";
  }
  if (s === "dd/mm/yyyy") {
    return "dd/mm/yyyy";
  }
  if (s === "yyyy-mm-dd") {
    return "yyyy-mm-dd";
  }
  if (s === "mm-dd-yyyy") {
    return "mm-dd-yyyy";
  }
  throw new Error(`Date: unsupported format ${JSON.stringify(raw)}`);
}

function parseCaseMode(value: string): CaseMode {
  const v = value.trim().toLowerCase();
  if (v === "sensitive") {
    return "sensitive";
  }
  if (v === "insensitive") {
    return "insensitive";
  }
  throw new Error(`Case: expected "sensitive" or "insensitive", got "${value}"`);
}

function parseSlashRegex(
  value: string,
  kind: "regex" | "rejectRegex",
): { kind: "regex"; pattern: string; flags: string } | { kind: "rejectRegex"; pattern: string; flags: string } {
  const t = value.trim();
  if (!t.startsWith("/")) {
    throw new Error("regex must start with /");
  }
  let i = 1;
  let pattern = "";
  while (i < t.length) {
    const c = t[i]!;
    if (c === "\\" && i + 1 < t.length) {
      // Preserve regex escapes (\d, \s, \w, \\, etc.) in the pattern string for RegExp.
      pattern += `\\${t[i + 1]!}`;
      i += 2;
      continue;
    }
    if (c === "/") {
      const flags = t.slice(i + 1).trim();
      if (kind === "regex") {
        return { kind: "regex", pattern, flags };
      }
      return { kind: "rejectRegex", pattern, flags };
    }
    pattern += c;
    i++;
  }
  throw new Error("unterminated regex");
}

function parseBetween(value: string): Rule {
  const t = value.trim();
  const first = scanDelimitedString(t, 0);
  const afterFirst = t.slice(first.end).trim();
  const andMatch = /^and\s+/i.exec(afterFirst);
  if (!andMatch) {
    throw new Error('Between: expected quoted start, then "and", then quoted end');
  }
  const rest = afterFirst.slice(andMatch[0]!.length).trim();
  const second = scanDelimitedString(rest, 0);
  if (rest.slice(second.end).trim() !== "") {
    throw new Error("Between: unexpected text after second string");
  }
  return { kind: "between", start: first.value, end: second.value };
}

function parseCount(value: string): Rule {
  const t = value.trim();
  const ofMatch = /^(\d+)\s+of\s+/i.exec(t);
  if (ofMatch) {
    const count = Number(ofMatch[1]!);
    const rest = t.slice(ofMatch[0]!.length).trim();
    const literal = parseOneDelimitedLiteral(rest, "Count");
    return { kind: "countLiteral", count, literal };
  }
  const matchesMatch = /^(\d+)\s+matches\s+/i.exec(t);
  if (matchesMatch) {
    const count = Number(matchesMatch[1]!);
    const rest = t.slice(matchesMatch[0]!.length).trim();
    const rx = parseSlashRegex(rest, "regex");
    return { kind: "countRegex", count, pattern: rx.pattern, flags: rx.flags };
  }
  throw new Error('Count: expected "N of <quoted literal>" or "N matches /.../"');
}

function parseLength(value: string): Rule {
  const t = value.trim();
  const atLeast = /^at\s+least\s+(\d+)$/i.exec(t);
  if (atLeast) {
    return { kind: "lengthAtLeast", bytes: Number(atLeast[1]!) };
  }
  const atMost = /^at\s+most\s+(\d+)$/i.exec(t);
  if (atMost) {
    return { kind: "lengthAtMost", bytes: Number(atMost[1]!) };
  }
  const exactly = /^exactly\s+(\d+)$/i.exec(t);
  if (exactly) {
    return { kind: "lengthExactly", bytes: Number(exactly[1]!) };
  }
  const between = /^between\s+(\d+)\s+and\s+(\d+)$/i.exec(t);
  if (between) {
    const min = Number(between[1]!);
    const max = Number(between[2]!);
    if (min > max) {
      throw new Error("Length: between min must be less than or equal to max");
    }
    return { kind: "lengthBetween", min, max };
  }
  throw new Error(
    'Length: expected "at least N", "at most N", "exactly N", or "between N and M" (non-negative integers)',
  );
}
