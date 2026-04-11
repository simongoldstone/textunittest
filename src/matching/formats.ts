import type { DateFormatId, RequireFormatSpec } from "../models/format.js";

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const UK_POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (year < 1 || year > 9999) {
    return false;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function parseDateParts(s: string, fmt: DateFormatId): { d: number; m: number; y: number } | null {
  let m: RegExpMatchArray | null;
  switch (fmt) {
    case "dd-mm-yyyy":
    case "dd/mm/yyyy": {
      const sep = fmt === "dd-mm-yyyy" ? "-" : "/";
      m = s.match(new RegExp(`^(\\d{2})${sep}(\\d{2})${sep}(\\d{4})$`));
      if (!m) {
        return null;
      }
      return { d: Number(m[1]!), m: Number(m[2]!), y: Number(m[3]!) };
    }
    case "yyyy-mm-dd": {
      m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) {
        return null;
      }
      return { y: Number(m[1]!), m: Number(m[2]!), d: Number(m[3]!) };
    }
    case "mm-dd-yyyy": {
      m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (!m) {
        return null;
      }
      return { m: Number(m[1]!), d: Number(m[2]!), y: Number(m[3]!) };
    }
    default: {
      const _x: never = fmt;
      return _x;
    }
  }
}

function dateTokenValid(token: string, fmt: DateFormatId): boolean {
  const parts = parseDateParts(token, fmt);
  if (!parts) {
    return false;
  }
  return isValidCalendarDate(parts.d, parts.m, parts.y);
}

function extractDateCandidates(line: string, fmt: DateFormatId): string[] {
  const patterns: Record<DateFormatId, RegExp> = {
    "dd-mm-yyyy": /\b\d{2}-\d{2}-\d{4}\b/g,
    "dd/mm/yyyy": /\b\d{2}\/\d{2}\/\d{4}\b/g,
    "yyyy-mm-dd": /\b\d{4}-\d{2}-\d{2}\b/g,
    "mm-dd-yyyy": /\b\d{2}-\d{2}-\d{4}\b/g,
  };
  const re = patterns[fmt];
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, "g");
  while ((m = r.exec(line)) !== null) {
    out.push(m[0]!);
  }
  return out;
}

function matchPhoneMask(value: string, mask: string): boolean {
  if (value.length !== mask.length) {
    return false;
  }
  for (let i = 0; i < mask.length; i++) {
    const sym = mask[i]!;
    const ch = value[i]!;
    if (sym === "9") {
      if (!/\d/.test(ch)) {
        return false;
      }
    } else if (sym === "A") {
      if (!/[A-Z]/.test(ch)) {
        return false;
      }
    } else if (sym === "a") {
      if (!/[a-z]/.test(ch)) {
        return false;
      }
    } else if (sym === "*") {
      if (!/[A-Za-z0-9]/.test(ch)) {
        return false;
      }
    } else if (ch !== sym) {
      return false;
    }
  }
  return true;
}

function findMaskSubstring(line: string, mask: string): string | null {
  if (mask.length === 0 || line.length < mask.length) {
    return null;
  }
  for (let i = 0; i + mask.length <= line.length; i++) {
    const sub = line.slice(i, i + mask.length);
    if (matchPhoneMask(sub, mask)) {
      return sub;
    }
  }
  return null;
}

const INT_RE = /^-?\d+$/;
const DECIMAL_RE = /^-?\d+\.\d+$/;

function findIntegerInLine(line: string): string | null {
  const re = /\b-?\d+\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const t = m[0]!;
    const rest = line.slice(m.index + t.length);
    if (!rest.startsWith(".") && INT_RE.test(t)) {
      return t;
    }
  }
  return null;
}

function findDecimalInLine(line: string): string | null {
  const re = /\b-?\d+\.\d+\b/g;
  const m = re.exec(line);
  return m ? m[0]! : null;
}

function findCurrencyInLine(line: string, symbol: string): string | null {
  const esc = symbol.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const re = new RegExp(`${esc}\\s*-?\\d+(?:\\.\\d{1,2})?`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    return m[0]!;
  }
  return null;
}

function lineMatchesSpec(line: string, spec: RequireFormatSpec): boolean {
  switch (spec.kind) {
    case "date": {
      const candidates = extractDateCandidates(line, spec.dateFormat);
      return candidates.some((c) => dateTokenValid(c, spec.dateFormat));
    }
    case "phone":
      return findMaskSubstring(line, spec.mask) !== null;
    case "email":
      return EMAIL_RE.test(line);
    case "integer":
      return findIntegerInLine(line) !== null;
    case "decimal":
      return findDecimalInLine(line) !== null;
    case "currency":
      return findCurrencyInLine(line, spec.symbol) !== null;
    case "uuid":
      return UUID_RE.test(line);
    case "ukPostcode":
      return UK_POSTCODE_RE.test(line);
    case "customMask":
      return findMaskSubstring(line, spec.mask) !== null;
    default: {
      const _e: never = spec;
      return _e;
    }
  }
}

/** True if any line in the scope contains a valid match for the format. */
export function scopeHasFormatMatch(scope: string, spec: RequireFormatSpec): boolean {
  const lines = scope.split(/\r?\n/);
  return lines.some((line) => lineMatchesSpec(line, spec));
}

export function formatSpecLabel(spec: RequireFormatSpec): string {
  switch (spec.kind) {
    case "date":
      return `Date(${spec.dateFormat})`;
    case "phone":
      return `Phone(${spec.mask})`;
    case "email":
      return "Email";
    case "integer":
      return "Integer";
    case "decimal":
      return "Decimal";
    case "currency":
      return `Currency(${spec.symbol})`;
    case "uuid":
      return "UUID";
    case "ukPostcode":
      return "UKPostcode";
    case "customMask":
      return `Mask(${spec.mask})`;
    default: {
      const _e: never = spec;
      return _e;
    }
  }
}
