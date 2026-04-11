/** Max span for `*` per spec v1. */
export const WILDCARD_STAR_MAX = 50;

/**
 * Convert a glob-style pattern (* and ?) to a RegExp.
 * `*` → .{0,50}? (non-greedy, single line — no newlines in span)
 * `?` → .
 */
export function wildcardPatternToRegex(pattern: string, caseInsensitive: boolean): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === "*") {
      re += `.{0,${WILDCARD_STAR_MAX}}?`;
    } else if (c === "?") {
      re += ".";
    } else if (/[\\^$.*+?()[\]{}|]/.test(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(re, caseInsensitive ? "i" : "");
}

/** True if any single line in the text matches (wildcards do not cross newlines). */
export function wildcardMatchesScope(scope: string, pattern: string, caseInsensitive: boolean): boolean {
  const re = wildcardPatternToRegex(pattern, caseInsensitive);
  const lines = scope.split(/\r?\n/);
  return lines.some((line) => {
    if (line.includes("\n")) {
      return false;
    }
    return re.test(line);
  });
}
