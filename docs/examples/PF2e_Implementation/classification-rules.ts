// PF2e classification-rules.ts (example scaffold)
// This is a Tier 2 sample implementation using the Tier 1 skeleton's types and helpers.
// Purpose: show a minimal and clear PF2e classifier that NotebookLM can use as a gold-standard.

// Use a minimal local CanonicalData shape to avoid requiring project TS paths
export interface CanonicalData {
  name: string;
  level: string | null;
  hd: string | null;
  hp: number | null;
  ac: number | null;
  disposition: string | null;
  primaryAttributes: string | null;
  equipment: string | null;
  coins: string | null;
}

// Minimal EntityClassification for the sample PF2e profile
export interface EntityClassification {
  kind: 'monster' | 'npc' | 'hazard' | 'unknown';
  rank?: 'minion' | 'normal' | 'boss';
  system: 'pf2e';
  rationale?: string;
  confidence?: 'high' | 'medium' | 'low';
}

// Extract numeric fields for PF2e stat blocks
export function extractPF2eStatNumbers(textBlock: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // HP — matches: HP: 20 or HP: 20 (2d8+4)
  const hpMatch = textBlock.match(/\bHP\s*:\s*(\d+)/i);
  out.hp = hpMatch ? Number(hpMatch[1]) : null;

  // AC — AC: 16 (Leather Armor)
  const acMatch = textBlock.match(/\bAC\s*:\s*(\d+)/i);
  out.ac = acMatch ? Number(acMatch[1]) : null;

  // Level — Level: 8 or Level: 8 (for named NPCs)
  const levelMatch = textBlock.match(/\bLevel\s*:\s*(\d+)/i);
  out.level = levelMatch ? Number(levelMatch[1]) : null;

  // Saves — e.g., Fort +16, Ref +13, Will +19
  const fort = textBlock.match(/\bFort\s*([+-]?\d+)/i);
  const ref = textBlock.match(/\bRef\s*([+-]?\d+)/i);
  const will = textBlock.match(/\bWill\s*([+-]?\d+)/i);
  out.saves = {
    Fort: fort ? Number(fort[1]) : null,
    Ref: ref ? Number(ref[1]) : null,
    Will: will ? Number(will[1]) : null
  };

  // Abilities — STR 18 (+4)
  const abilityRegex = /\b(STR|DEX|CON|INT|WIS|CHA)\s+(\d+)(?:\s*\((?:\+|-)?\d+\))?/ig;
  const abilities: Record<string, number> = {};
  let m;
  // Use a regex loop to extract abilities
  while ((m = abilityRegex.exec(textBlock)) !== null) {
    abilities[m[1]] = Number(m[2]);
  }
  out.abilities = Object.keys(abilities).length ? abilities : null;

  // Skill DCs (Stealth, Disable, etc.) — find common "DC 20" tokens
  const dcRegex = /(Stealth|Disable|Reflex|Perception)[:\s]*DC\s*(\d+)/ig;
  const dcs: Record<string, number> = {};
  while ((m = dcRegex.exec(textBlock)) !== null) {
    dcs[m[1]] = Number(m[2]);
  }
  out.skill_dcs = Object.keys(dcs).length ? dcs : null;

  return out;
}

// Map PF2e traits to generic system categories
export function mapTraitsToSystemTypes(traits: string[] | string): string[] {
  if (!traits) return [];
  const t = Array.isArray(traits) ? traits : traits.split(/[,;|]/).map(s => s.trim());
  const out: string[] = [];

  for (const trait of t) {
    const lower = trait.toLowerCase();
    if (lower.includes('trap') || lower.includes('hazard')) {
      out.push('hazard');
      continue;
    }
    if (lower.includes('goblin') || lower.includes('humanoid') || lower.includes('beast')) {
      out.push('creature');
      continue;
    }
    if (lower.includes('classed') || lower.includes('leader') || lower.includes('marshal') || lower.includes('npc')) {
      out.push('npc');
      continue;
    }
    // Default: keep trait label
    out.push(trait);
  }

  return Array.from(new Set(out));
}

// Primary PF2e classification function
export function classifyEntityPF2e(
  creatureName: string,
  canonicalData: CanonicalData | null,
  traits?: string[] | string
): EntityClassification {
  // Default to unknown
  const result: EntityClassification = {
    kind: 'unknown',
    system: 'pf2e',
    rationale: 'Default - no heuristics matched',
    confidence: 'low'
  };

  // Basic hazard detection: type contains 'trap' or 'hazard'
  const typeGuess = canonicalData?.name || creatureName || '';
  if (/\btrap\b|\bhazard\b/i.test(typeGuess) || (traits && (String(traits).toLowerCase().includes('trap') || String(traits).toLowerCase().includes('hazard')))) {
    result.kind = 'hazard';
    result.rationale = 'Detected PF2e hazard/trap terms';
    result.confidence = 'high';
    return result;
  }

  // Named NPC detection
  // nameLower intentionally unused if we classify based on `traits` and explicit keywords
  const classedTrait = traits && (String(traits).toLowerCase().includes('classed') || String(traits).toLowerCase().includes('leader'));
  if (classedTrait) {
    result.kind = 'npc';
    result.rationale = 'PF2e has "Classed" or "Leader" trait - treat as NPC';
    result.confidence = 'high';
    // Infer rank from level
    if (canonicalData && canonicalData.level) {
      const lv = Number(String(canonicalData.level).match(/\d+/)?.[0] ?? 0);
      if (lv <= 2) result.rank = 'minion';
      else if (lv <= 8) result.rank = 'normal';
      else result.rank = 'boss';
    }
    return result;
  }

  // PF2e uses Level instead of HD; treat explicit Level + class keywords as NPC else Monster
  if (canonicalData && canonicalData.level) {
    // If Level exists and we haven't found class keywords, lean towards npc (PF2e uses Level for both but in most modules classed NPCs show Level plus class)
    const levelText = canonicalData.level;
    // heuristics: if 'class' words appear in Level -> NPC
    const classIndicators = /(fighter|wizard|cleric|ranger|bard|rogue|paladin|sorcerer|monk)/i;
    if (classIndicators.test(String(levelText))) {
      result.kind = 'npc';
      result.rationale = 'Level + class indicator found in PF2e Level string';
      result.confidence = 'medium';
      return result;
    }

    // If Level exists but no class indicator, treat as monster (best guess) unless we saw an NPC trait
    result.kind = 'monster';
    result.rationale = 'Level present without class indicator => likely monster or stat-block without class';
    result.confidence = 'medium';
    return result;
  }

  // Fallback to corpus-based heuristic using name keywords
  if (/\b(goblin|orc|wolf|bear|dragon|skeleton|zombie|ogre|giant)\b/i.test(creatureName)) {
    result.kind = 'monster';
    result.rationale = 'Common monster keyword detected in name';
    result.confidence = 'high';
    return result;
  }

  // Final fallback: mark as NPC to be safe
  result.kind = 'npc';
  result.rationale = 'No strong indicators for hazard/monster; default to npc';
  result.confidence = 'low';
  return result;
}

/* ------------------------------------------------------------------
 * Self-test harness: This code block is runnable with ts-node for manual checks
 * Usage:
 *   npx ts-node docs/examples/PF2e_Implementation/classification-rules.ts
 * It reads `system-profiles/Pathfinder2/sample_stat_blocks.md` if available
 * and runs the classifier against each block. This is intentionally in
 * docs/examples for demonstration only — it does not touch production code.
 * ------------------------------------------------------------------*/

if (require.main === module) {
  (async () => {
    const fs = await import('fs');
    const path = 'system-profiles/Pathfinder2/sample_stat_blocks.md';
    if (!fs.existsSync(path)) {
      console.error('Sample PF2e stat blocks not found at', path);
      process.exit(1);
    }
    const txt = fs.readFileSync(path, 'utf8');
    const entries = txt.split('\n---\n').map(s => s.trim()).filter(Boolean);
    for (const entry of entries) {
      const [titleLine] = entry.split('\n');
      const name = titleLine.replace(/^##?\s*/,'').trim() || 'Unknown';
      const cd: CanonicalData = {
        name,
        level: (entry.match(/\bLevel\s*:\s*(\d+)/i) || [])[1] ?? null,
        hd: null,
        hp: Number((entry.match(/\bHP\s*:\s*(\d+)/i) || [])[1] ?? null),
        ac: Number((entry.match(/\bAC\s*:\s*(\d+)/i) || [])[1] ?? null),
        disposition: null,
        primaryAttributes: null,
        equipment: null,
        coins: null,
      };
      const traitsMatch = entry.match(/\*\*Traits\*\*:\s*(.*)/i);
      const traits = traitsMatch ? traitsMatch[1].split(/,\s*/) : [];
      console.log('---');
      console.log('Name:', name);
      console.log('Extracted fields:', extractPF2eStatNumbers(entry));
      console.log('Mapped traits:', mapTraitsToSystemTypes(traits));
      console.log('Classification:', classifyEntityPF2e(name, cd, traits));
    }
  })();
}
