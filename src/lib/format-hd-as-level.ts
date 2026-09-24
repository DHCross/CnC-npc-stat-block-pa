/**
 * Converts HD format (e.g., "4d12", "2d8") to Level format (e.g., "4(d12)", "2(d8)")
 * Per OGL: HD refers to the physical die only; Level refers to creature power level.
 *
 * A trailing +/- modifier (e.g., "5d8+5") is a legacy hit-point adjustment, NOT
 * part of the creature's Level. It is stripped from the Level expression; callers
 * can recover it via extractHdHpModifier to flag it as an unresolved HP contribution.
 *
 * @param hd - Hit dice string in XdY format
 * @returns Level format string X(dY)
 */
export function formatHdAsLevel(hd: string): string {
  if (!hd) return '';

  // Match patterns like "4d12", "2d8", "1d6", etc.
  const match = hd.match(/^(\d+)d(\d+)/);
  if (!match) return hd; // Return as-is if format doesn't match

  const [, count, die] = match;
  return `${count}(d${die})`;
}

/**
 * Extracts the legacy hit-point modifier from an HD expression, e.g.
 * "5d8+5" -> "+5", "5d8-2" -> "-2". Returns null when no modifier is present.
 * The modifier contributes to HP, not Level; it should be flagged for editorial
 * resolution rather than silently dropped.
 */
export function extractHdHpModifier(hd: string): string | null {
  if (!hd) return null;
  const match = hd.match(/^\d+d\d+([+-]\d+)/);
  return match ? match[1] : null;
}
