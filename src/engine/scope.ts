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
    default:
      return win;
  }
}
