import type { CaseMode, Rule, TestCaseAst, TestSuiteAst } from "../models/ast.js";
import type { DateFormatId, RequireFormatSpec } from "../models/format.js";
import {
  FUZZY_MAX_TOLERANCE,
  FUZZY_MIN_PHRASE_LENGTH,
  FUZZY_MIN_TOLERANCE,
} from "../matching/fuzzy.js";
import { isStringDelimiter, parseOneDelimitedLiteral, parsePathValue, scanDelimitedString } from "./strings.js";

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
  "Reject Format:",
  "Reject Regex:",
  "First Line Must Equal:",
  "Last Line Must Equal:",
  "Line Must Equal:",
  "Require Any Of:",
  "Reject Any Of:",
  "Starts With:",
  "Ends With:",
  "Between Lines:",
  "Between:",
  "On Line:",
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
  "If:",
];

export function parseSuiteMarkdown(source: string, filename?: string, params?: Record<string, string>): ParseResult {
  const errors: string[] = [];
  const prefix = filename ? `${filename}: ` : "";
  const resolvedParams = params ?? {};

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

    if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) {
      continue;
    }

    if (currentTest === null) {
      errors.push(`${prefix}line ${lineIndex + 1}: rule must appear under a ## test heading`);
      continue;
    }

    try {
      const rule = parseRuleLine(trimmed, resolvedParams);
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

/**
 * Replace `{{varName}}` placeholders in the given text with values from params.
 * Unknown variable names are left as-is (lenient substitution).
 */
function interpolateParams(text: string, params: Record<string, string>): string {
  return text.replace(/\{\{([^{}]+)\}\}/g, (_match, name: string) => {
    const key = name.trim();
    return Object.prototype.hasOwnProperty.call(params, key) ? params[key]! : _match;
  });
}

function parseRuleLine(line: string, params: Record<string, string>): Rule | null {
  for (const key of KEY_ORDER) {
    if (line.startsWith(key)) {
      const rawValue = line.slice(key.length).trim();
      // If: values are parsed as conditions — do NOT interpolate so the {{...}} wrapper is preserved.
      const value = key === "If:" ? rawValue : interpolateParams(rawValue, params);
      return parseRuleValue(key, value);
    }
  }
  throw new Error(`unrecognized rule (expected one of: ${KEY_ORDER.join(", ")})`);
}

function parseOnLine(value: string): Rule {
  const t = value.trim();
  const m = /^(\d+)$/.exec(t);
  if (!m) {
    throw new Error('On Line: expected a single line number (e.g. 12)');
  }
  const n = Number(m[1]);
  if (n < 1) {
    throw new Error("On Line: line numbers must be at least 1");
  }
  return { kind: "onLine", line: n };
}

function parseBetweenLines(value: string): Rule {
  const t = value.trim();
  const m = /^(\d+)\s+and\s+(\d+)$/i.exec(t);
  if (!m) {
    throw new Error('Between Lines: expected "N and M" (e.g. 15 and 22)');
  }
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a < 1 || b < 1) {
    throw new Error("Between Lines: line numbers must be at least 1");
  }
  if (a > b) {
    throw new Error("Between Lines: first line must be less than or equal to last line");
  }
  return { kind: "betweenLines", firstLine: a, lastLine: b };
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
    case "Between Lines:":
      return parseBetweenLines(value);
    case "On Line:":
      return parseOnLine(value);
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
      return { kind: "requireFormat", spec: parseFormatSpec(value, "Require Format") };
    case "Reject Format:":
      return { kind: "rejectFormat", spec: parseFormatSpec(value, "Reject Format") };
    case "Require Any Of:":
      return { kind: "requireAnyOf", literals: parseOrSeparatedLiterals(value, "Require Any Of") };
    case "Reject Any Of:":
      return { kind: "rejectAnyOf", literals: parseOrSeparatedLiterals(value, "Reject Any Of") };
    case "Line Must Equal:":
      return parseLineMustEqual(value);
    case "First Line Must Equal:":
      return { kind: "firstLineMustEqual", literal: parseOneDelimitedLiteral(value, "First Line Must Equal") };
    case "Last Line Must Equal:":
      return { kind: "lastLineMustEqual", literal: parseOneDelimitedLiteral(value, "Last Line Must Equal") };
    case "Tolerance:":
      return parseTolerance(value);
    case "If:":
      return parseIfRule(value);
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

function parseIfRule(value: string): Rule {
  const t = value.trim();
  // Expect the value to be wrapped in {{ ... }}
  const m = /^\{\{([\s\S]+)\}\}$/.exec(t);
  if (!m) {
    throw new Error(
      'If: expected a condition wrapped in {{ }}, e.g. If: {{switch=yes}} or If: {{featureEnabled}}',
    );
  }
  const condition = m[1]!.trim();
  if (condition === "") {
    throw new Error('If: condition inside {{ }} must not be empty');
  }
  return { kind: "if", condition };
}

function parseFormatSpec(value: string, label: string): RequireFormatSpec {
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
    `${label}: unknown built-in (try Email, UUID, Date(dd-mm-yyyy), Phone(...), Mask(...), etc.)`,
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

function parseOrSeparatedLiterals(value: string, ruleName: string): string[] {
  const t = value.trim();
  const out: string[] = [];
  let pos = 0;
  while (pos < t.length && /\s/.test(t[pos]!)) {
    pos++;
  }
  if (pos >= t.length) {
    throw new Error(`${ruleName}: need at least two quoted options separated by "or"`);
  }
  while (pos < t.length) {
    if (!isStringDelimiter(t[pos]!)) {
      throw new Error(`${ruleName}: expected a quoted string (use ", ', or \`)`);
    }
    const scanned = scanDelimitedString(t, pos);
    out.push(scanned.value);
    pos = scanned.end;
    while (pos < t.length && /\s/.test(t[pos]!)) {
      pos++;
    }
    if (pos >= t.length) {
      break;
    }
    const rest = t.slice(pos);
    const orM = /^or\s+/i.exec(rest);
    if (!orM) {
      throw new Error(`${ruleName}: use the word "or" between each option`);
    }
    pos += orM[0]!.length;
  }
  if (out.length < 2) {
    throw new Error(`${ruleName}: need at least two quoted options (for one option use Require: or Reject:)`);
  }
  return out;
}

function parseLineMustEqual(value: string): Rule {
  const t = value.trim();
  const m = /^(\d+)\s+/.exec(t);
  if (!m) {
    throw new Error('Line Must Equal: start with the line number, then a quoted string (example: 12 "BEGIN")');
  }
  const lineNum = Number(m[1]!);
  if (lineNum < 1) {
    throw new Error("Line Must Equal: line numbers must be at least 1");
  }
  const rest = t.slice(m[0]!.length).trimStart();
  const literal = parseOneDelimitedLiteral(rest, "Line Must Equal");
  return { kind: "lineMustEqual", line: lineNum, literal };
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

  const atLeastOf = /^at\s+least\s+(\d+)\s+of\s+/i.exec(t);
  if (atLeastOf) {
    const count = Number(atLeastOf[1]!);
    const rest = t.slice(atLeastOf[0]!.length).trim();
    const literal = parseOneDelimitedLiteral(rest, "Count");
    return { kind: "countLiteralAtLeast", count, literal };
  }
  const atMostOf = /^at\s+most\s+(\d+)\s+of\s+/i.exec(t);
  if (atMostOf) {
    const count = Number(atMostOf[1]!);
    const rest = t.slice(atMostOf[0]!.length).trim();
    const literal = parseOneDelimitedLiteral(rest, "Count");
    return { kind: "countLiteralAtMost", count, literal };
  }
  const betweenOf = /^between\s+(\d+)\s+and\s+(\d+)\s+of\s+/i.exec(t);
  if (betweenOf) {
    const min = Number(betweenOf[1]!);
    const max = Number(betweenOf[2]!);
    if (min > max) {
      throw new Error("Count: between min must be less than or equal to max");
    }
    const rest = t.slice(betweenOf[0]!.length).trim();
    const literal = parseOneDelimitedLiteral(rest, "Count");
    return { kind: "countLiteralBetween", min, max, literal };
  }

  const atLeastMatches = /^at\s+least\s+(\d+)\s+matches\s+/i.exec(t);
  if (atLeastMatches) {
    const count = Number(atLeastMatches[1]!);
    const rest = t.slice(atLeastMatches[0]!.length).trim();
    const rx = parseSlashRegex(rest, "regex");
    return { kind: "countRegexAtLeast", count, pattern: rx.pattern, flags: rx.flags };
  }
  const atMostMatches = /^at\s+most\s+(\d+)\s+matches\s+/i.exec(t);
  if (atMostMatches) {
    const count = Number(atMostMatches[1]!);
    const rest = t.slice(atMostMatches[0]!.length).trim();
    const rx = parseSlashRegex(rest, "regex");
    return { kind: "countRegexAtMost", count, pattern: rx.pattern, flags: rx.flags };
  }
  const betweenMatches = /^between\s+(\d+)\s+and\s+(\d+)\s+matches\s+/i.exec(t);
  if (betweenMatches) {
    const min = Number(betweenMatches[1]!);
    const max = Number(betweenMatches[2]!);
    if (min > max) {
      throw new Error("Count: between min must be less than or equal to max");
    }
    const rest = t.slice(betweenMatches[0]!.length).trim();
    const rx = parseSlashRegex(rest, "regex");
    return { kind: "countRegexBetween", min, max, pattern: rx.pattern, flags: rx.flags };
  }

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
  throw new Error(
    'Count: expected "N of ...", "at least N of ...", "at most N of ...", "between N and M of ...", or the same with "matches /.../"',
  );
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
