import type { Rule } from "../models/ast.js";

export interface ScopeWindow {
  scope: string;
  /** Inclusive start index in full file text. */
  start: number;
  /** Exclusive end index in full file text. */
  end: number;
}

function normalizeText(text: string, insensitive: boolean): string {
  return insensitive ? text.toLowerCase() : text;
}

export function lineNumberOneBased(fullContent: string, offset: number): number {
  let line = 1;
  const end = Math.min(offset, fullContent.length);
  for (let i = 0; i < end; i++) {
    if (fullContent[i] === "\n") {
      line++;
    }
  }
  return line;
}

/**
 * Character range in full-file coordinates for one 1-based line (newline is not included in the range).
 * Returns null if the line does not exist.
 */
export function fullFileLineRange(content: string, lineOneBased: number): { start: number; end: number } | null {
  if (lineOneBased < 1) {
    return null;
  }
  let line = 1;
  let i = 0;
  while (line < lineOneBased) {
    const j = content.indexOf("\n", i);
    if (j === -1) {
      return null;
    }
    i = j + 1;
    line++;
  }
  const start = i;
  const nl = content.indexOf("\n", start);
  const end = nl === -1 ? content.length : nl;
  return { start, end };
}

/**
 * Inclusive 1-based line range in full-file coordinates (each line excludes its trailing newline).
 */
export function fullFileLinesRange(
  content: string,
  firstLine: number,
  lastLine: number,
): { start: number; end: number } | null {
  if (firstLine < 1 || lastLine < firstLine) {
    return null;
  }
  const first = fullFileLineRange(content, firstLine);
  if (!first) {
    return null;
  }
  const last = fullFileLineRange(content, lastLine);
  if (!last) {
    return null;
  }
  return { start: first.start, end: last.end };
}

/** Text of one full-file line (no trailing newline), or null if the line does not exist. */
export function fullFileLineText(content: string, lineOneBased: number): string | null {
  const r = fullFileLineRange(content, lineOneBased);
  if (!r) {
    return null;
  }
  return content.slice(r.start, r.end);
}

/** True if the 1-based full-file line overlaps the scope window (any character in common). */
export function lineOverlapsWindow(
  content: string,
  lineOneBased: number,
  win: ScopeWindow,
): boolean {
  const r = fullFileLineRange(content, lineOneBased);
  if (!r) {
    return false;
  }
  return Math.max(win.start, r.start) < Math.min(win.end, r.end);
}

/** Split scope into lines (newline-separated); last line may be unterminated. */
export function scopeLines(scope: string): string[] {
  if (scope.length === 0) {
    return [""];
  }
  return scope.split(/\r?\n/);
}

function intersectWithRange(content: string, win: ScopeWindow, range: { start: number; end: number }): ScopeWindow | null {
  const a = Math.max(win.start, range.start);
  const b = Math.min(win.end, range.end);
  if (a >= b) {
    return null;
  }
  return { scope: content.slice(a, b), start: a, end: b };
}

export function applyLocationWindow(
  content: string,
  win: ScopeWindow,
  loc: Rule,
  insensitive: boolean,
): ScopeWindow | null {
  const slice = content.slice(win.start, win.end);
  const n = normalizeText(slice, insensitive);
  switch (loc.kind) {
    case "between": {
      const ns = normalizeText(loc.start, insensitive);
      const ne = normalizeText(loc.end, insensitive);
      const i = n.indexOf(ns);
      if (i === -1) {
        return null;
      }
      const afterStart = i + loc.start.length;
      const j = n.indexOf(ne, afterStart);
      if (j === -1) {
        return null;
      }
      return { scope: slice.slice(afterStart, j), start: win.start + afterStart, end: win.start + j };
    }
    case "after": {
      const nm = normalizeText(loc.marker, insensitive);
      const i = n.indexOf(nm);
      if (i === -1) {
        return null;
      }
      const from = i + loc.marker.length;
      return { scope: slice.slice(from), start: win.start + from, end: win.end };
    }
    case "before": {
      const nm = normalizeText(loc.marker, insensitive);
      const i = n.indexOf(nm);
      if (i === -1) {
        return null;
      }
      return { scope: slice.slice(0, i), start: win.start, end: win.start + i };
    }
    case "onLine": {
      const range = fullFileLineRange(content, loc.line);
      if (!range) {
        return null;
      }
      return intersectWithRange(content, win, range);
    }
    case "betweenLines": {
      const range = fullFileLinesRange(content, loc.firstLine, loc.lastLine);
      if (!range) {
        return null;
      }
      return intersectWithRange(content, win, range);
    }
    default:
      return win;
  }
}
