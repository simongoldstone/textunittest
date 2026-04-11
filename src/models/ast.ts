import type { RequireFormatSpec } from "./format.js";

export type { DateFormatId, RequireFormatSpec } from "./format.js";

/** Case sensitivity for literal and regex matching within a test. */
export type CaseMode = "sensitive" | "insensitive";

/** A single rule line inside a test case (document order preserved). */
export type Rule =
  | { kind: "target"; path: string }
  | { kind: "fail"; message: string }
  | { kind: "case"; mode: CaseMode }
  | { kind: "between"; start: string; end: string }
  | { kind: "after"; marker: string }
  | { kind: "before"; marker: string }
  /** Narrow scope to a single 1-based line in the target file (intersects with prior location window). */
  | { kind: "onLine"; line: number }
  /** Narrow scope to an inclusive 1-based line range in the target file (intersects with prior location window). */
  | { kind: "betweenLines"; firstLine: number; lastLine: number }
  | { kind: "require"; literal: string }
  /** At least one of these literals must appear (logical OR). */
  | { kind: "requireAnyOf"; literals: string[] }
  | { kind: "reject"; literal: string }
  /** None of these literals may appear (if any match, the test fails). */
  | { kind: "rejectAnyOf"; literals: string[] }
  | { kind: "regex"; pattern: string; flags: string }
  | { kind: "rejectRegex"; pattern: string; flags: string }
  | { kind: "countLiteral"; count: number; literal: string }
  | { kind: "countLiteralAtLeast"; count: number; literal: string }
  | { kind: "countLiteralAtMost"; count: number; literal: string }
  | { kind: "countLiteralBetween"; min: number; max: number; literal: string }
  | { kind: "countRegex"; count: number; pattern: string; flags: string }
  | { kind: "countRegexAtLeast"; count: number; pattern: string; flags: string }
  | { kind: "countRegexAtMost"; count: number; pattern: string; flags: string }
  | { kind: "countRegexBetween"; min: number; max: number; pattern: string; flags: string }
  | { kind: "startsWith"; literal: string }
  | { kind: "endsWith"; literal: string }
  /** Whole-file UTF-8 byte length (see language specification). */
  | { kind: "lengthAtLeast"; bytes: number }
  | { kind: "lengthAtMost"; bytes: number }
  | { kind: "lengthExactly"; bytes: number }
  | { kind: "lengthBetween"; min: number; max: number }
  /** Glob-style `*` (0–50 chars per segment, single line) and `?` (one char); non-greedy. */
  | { kind: "requirePattern"; pattern: string }
  /** Fuzzy phrase match (line-based); use with `Tolerance:` (default 85%). */
  | { kind: "fuzzyRequire"; phrase: string }
  /** Similarity threshold for the next `Fuzzy Require` in this test (50–100). */
  | { kind: "tolerance"; percent: number }
  /** Structured format validation (no regex for authors). */
  | { kind: "requireFormat"; spec: RequireFormatSpec }
  /** No line in scope may contain a valid match for this format. */
  | { kind: "rejectFormat"; spec: RequireFormatSpec }
  /** Full-file line N (1-based) text must equal the literal after trimming (see language spec). */
  | { kind: "lineMustEqual"; line: number; literal: string }
  /** First line of the current scope must equal the literal after trimming. */
  | { kind: "firstLineMustEqual"; literal: string }
  /** Last line of the current scope must equal the literal after trimming. */
  | { kind: "lastLineMustEqual"; literal: string };

export interface TestCaseAst {
  /** Level-two heading text. */
  name: string;
  rules: Rule[];
}

export interface TestSuiteAst {
  /** Level-one heading text. */
  title: string;
  tests: TestCaseAst[];
}
