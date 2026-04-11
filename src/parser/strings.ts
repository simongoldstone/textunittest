/**
 * String literals for rules that take quoted text (Require, Between, paths, etc.).
 *
 * Opening delimiter is one of: double quote ", single quote ', or backtick `.
 * Closing is the same character as the opening delimiter.
 *
 * Escapes (both may be used):
 * - Doubling the delimiter: "" → ", '' → ', `` → `
 * - Backslash: \", \', \`, \\
 */

const DELIMS = new Set(['"', "'", "`"]);

export function isStringDelimiter(c: string | undefined): boolean {
  return c !== undefined && DELIMS.has(c);
}

/** Parse a delimited string starting at `start` (must point at opening delimiter). */
export function scanDelimitedString(input: string, start: number): { value: string; end: number } {
  const delim = input[start];
  if (!isStringDelimiter(delim)) {
    throw new Error(`expected opening string delimiter (\", ', or \`), got ${JSON.stringify(delim)}`);
  }

  let i = start + 1;
  let out = "";

  while (i < input.length) {
    const c = input[i]!;

    // Doubling: "" '' `` → one delimiter character
    if (c === delim && i + 1 < input.length && input[i + 1] === delim) {
      out += delim;
      i += 2;
      continue;
    }

    // Closing delimiter (not doubled)
    if (c === delim) {
      return { value: out, end: i + 1 };
    }

    // Backslash escapes
    if (c === "\\" && i + 1 < input.length) {
      const n = input[i + 1]!;
      switch (n) {
        case "\\":
          out += "\\";
          i += 2;
          continue;
        case '"':
          out += '"';
          i += 2;
          continue;
        case "'":
          out += "'";
          i += 2;
          continue;
        case "`":
          out += "`";
          i += 2;
          continue;
        default:
          throw new Error(`invalid escape sequence: \\${n}`);
      }
    }

    out += c;
    i++;
  }

  throw new Error("unterminated string");
}

/** Parse a full `value` that must be exactly one delimited string (optional surrounding whitespace). */
export function parseOneDelimitedLiteral(value: string, label: string): string {
  const t = value.trim();
  if (t.length === 0 || !isStringDelimiter(t[0])) {
    throw new Error(`${label}: value must be a quoted string (use ", ', or \`)`);
  }
  const { value: inner, end } = scanDelimitedString(t, 0);
  if (t.slice(end).trim() !== "") {
    throw new Error(`${label}: unexpected text after closing quote`);
  }
  return inner;
}

/** Parse a path: either an unquoted token or a delimited string. */
export function parsePathValue(value: string): string {
  const t = value.trim();
  if (t.length === 0) {
    return t;
  }
  if (isStringDelimiter(t[0])) {
    const { value: path, end } = scanDelimitedString(t, 0);
    if (t.slice(end).trim() !== "") {
      throw new Error("Target: unexpected text after path string");
    }
    return path;
  }
  return t;
}
