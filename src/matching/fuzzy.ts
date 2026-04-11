import { distance } from "fastest-levenshtein";

export const FUZZY_MIN_PHRASE_LENGTH = 5;
export const FUZZY_DEFAULT_TOLERANCE_PERCENT = 85;
export const FUZZY_MIN_TOLERANCE = 50;
export const FUZZY_MAX_TOLERANCE = 100;

/** Levenshtein-based similarity 0–100. */
export function similarityPercent(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) {
    return 100;
  }
  const d = distance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round(100 * (1 - d / maxLen));
}

/**
 * Compare phrase to each line using sliding windows whose lengths are within ±30% of phrase length.
 * Pass if any window reaches at least `tolerancePercent` similarity.
 */
export function fuzzyPhraseMatchesLineScope(
  scope: string,
  phrase: string,
  tolerancePercent: number,
  caseInsensitive: boolean,
): boolean {
  const p = caseInsensitive ? phrase.toLowerCase() : phrase;
  const L = p.length;
  const minW = Math.max(1, Math.floor(L * 0.7));
  const maxW = Math.max(minW, Math.ceil(L * 1.3));

  const lines = scope.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = caseInsensitive ? rawLine.toLowerCase() : rawLine;
    if (line.length === 0) {
      continue;
    }
    for (let w = minW; w <= maxW && w <= line.length; w++) {
      for (let i = 0; i + w <= line.length; i++) {
        const window = line.slice(i, i + w);
        const sim = similarityPercent(window, p);
        if (sim >= tolerancePercent) {
          return true;
        }
      }
    }
  }
  return false;
}
