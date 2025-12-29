// PF2e classification rules (scaffold)
// Minimal classifier to detect spell lists and mark them as reference.

export type ClassificationResult = {
  classification: string;
  signals: Record<string, boolean>;
  spell_context?: 'reference' | 'descriptive';
  origin_context?: string | null;
};

/**
 * classifyPF2eEntity
 * - Very small heuristic: if the raw text contains a `Spells:` line,
 *   mark `spell_context: 'reference'` and set `HasSpells`.
 * - This scaffold is intentionally minimal; integrate into the main
 *   `classification-rules.ts` tree for production.
 */
export function classifyPF2eEntity(rawText: string, origin = 'pf2e'): ClassificationResult {
  const lower = rawText.toLowerCase();
  const hasSpells = /\bspells\s*[:\n]/i.test(rawText);
  const classification = hasSpells ? 'creature-with-spells' : 'unknown';
  return {
    classification,
    signals: { HasSpells: hasSpells },
    spell_context: hasSpells ? 'reference' : undefined,
    origin_context: origin || null,
  };
}

export default classifyPF2eEntity;
