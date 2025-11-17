/**
 * Converts HD format (e.g., "4d12", "2d8+4") to Level format (e.g., "4(d12)", "2(d8+4)")
 * Per OGL: HD refers to the physical die only; Level refers to creature power level.
 * @param hd - Hit dice string in XdY format
 * @returns Level format string X(dY)
 */
export function formatHdAsLevel(hd: string): string {
  if (!hd) return '';
  
  // Match patterns like "4d12", "2d8+4", "1d6", etc.
  const match = hd.match(/^(\d+)(d\d+(?:[+-]\d+)?)$/);
  if (!match) return hd; // Return as-is if format doesn't match
  
  const [, count, die] = match;
  return `${count}(${die})`;
}
