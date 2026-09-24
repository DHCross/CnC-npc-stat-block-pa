// Monster stat block formatter module
// This module handles formatting for full-fledged monster stat blocks,
// NOT NPCs, NPC units, or units of non-humans with character classes.
//
// Key distinguishing features of monsters:
// - HD (Hit Dice) input renders as "Level X(dY)" per the abbreviated template
// - Have monster-specific fields: TREASURE, XP, SAVES, TYPE, ALIGNMENT
// - Do not have character classes (fighter, wizard, etc.)
// - Follow different formatting rules than classed NPCs

import type { ParsedNPC, ValidationResult, ValidationWarning, WarningType } from './stat-block-types';
import { buildSubjectDescriptor, normalizeDisposition, toPossessiveSubject, formatHdAsLevel, extractHdHpModifier } from './stat-block-helpers';

export type { ParsedNPC, ValidationResult, ValidationWarning, WarningType } from './stat-block-types';

/**
 * Detects whether a parsed stat block represents a Basic Monster
 * (not a classed NPC or character).
 *
 * Monsters have:
 * - HD (Hit Dice) or explicit Level field
 * - Monster-specific fields: TYPE, TREASURE, XP, SAVES, ALIGNMENT
 * - NO character class information
 */
export function isBasicMonster(parsed: ParsedNPC): boolean {
  // Check for monster-specific fields that indicate this is a Basic Monster, not a Classed NPC
  return !!(parsed.fields['HD'] ||
           parsed.fields['Level'] ||
           parsed.fields['TYPE'] ||
           parsed.fields['Type'] ||
           parsed.fields['TREASURE'] ||
           parsed.fields['Treasure'] ||
           parsed.fields['XP'] ||
           parsed.fields['SAVES'] ||
           parsed.fields['Saves'] ||
           parsed.fields['ALIGNMENT']);
}

/**
 * Formats a monster stat block into canonical narrative form.
 * Follows Castles & Crusades Reforge standards for monster formatting.
 */
export function formatToMonsterNarrative(parsed: ParsedNPC): string {
  // Extract name and format with proper bolding
  let name = parsed.name.trim();
  if (!name.startsWith('**')) {
    name = `**${name.replace(/\*\*/g, '').trim()}**`;
  }

  const unitMatch = name.match(/\*\*([^*]+?)\s*x(\d+)\*\*/);
  const isPlural = unitMatch !== null;

  const statParts: string[] = [];

  // Level/HD — HD XdY renders as Level X(dY) in the abbreviated template
  const level = parsed.fields['Level'] || parsed.fields['HD'];
  if (level) {
    statParts.push(`Level ${formatHdAsLevel(level)}`);
  }

  // Hit Points (prefer explicit HP if present for named creatures or when available)
  const hp = parsed.fields['Hit Points (HP)'];
  if (hp) {
    statParts.push(`HP ${hp}`);
  }

  // AC
  const ac = parsed.fields['Armor Class (AC)'] || parsed.fields['AC'];
  if (ac) {
    statParts.push(`AC ${ac}`);
  }

  // Disposition
  const disposition = parsed.fields['Disposition'];
  if (disposition) {
    statParts.push(`disposition ${normalizeDisposition(disposition)}`);
  }

  // Movement
  const move = parsed.fields['Move'] || parsed.fields['MOVE'];
  if (move) {
    statParts.push(`moves ${move.toLowerCase()}`);
  }

  // Attacks
  const attacks = parsed.fields['Attacks'] || parsed.fields['ATTACKS'];
  if (attacks) {
    statParts.push(`attacks with ${attacks}`);
  }

  // Saves
  const saves = parsed.fields['Saves'] || parsed.fields['SAVES'];
  if (saves) {
    const saveText = saves === 'P' ? 'Physical' : saves === 'M' ? 'Mental' : saves;
    statParts.push(`save category is ${saveText}`);
  }

  // Special abilities
  const special = parsed.fields['Special Abilities'] || parsed.fields['SPECIAL'];
  if (special) {
    statParts.push(`Special: ${special}`);
  }

  // Type
  const type = parsed.fields['Type'] || parsed.fields['TYPE'];
  if (type) {
    statParts.push(`Type: ${type}`);
  }

  // Treasure
  const treasure = parsed.fields['Treasure'] || parsed.fields['TREASURE'];
  if (treasure) {
    statParts.push(`Treasure: ${treasure}`);
  }

  // XP
  const xp = parsed.fields['XP'];
  if (xp) {
    statParts.push(`XP: ${xp}`);
  }

  const subject = buildSubjectDescriptor({
    isPlural,
    fallback: isPlural ? 'creatures' : 'creature',
  });
  const possessiveSubject = toPossessiveSubject(subject, isPlural);
  const statsText = statParts.join(', ');
  if (!statsText) {
    // If we don't have any vital stats for this monster, return the name only.
    // Avoid appending a diagnostic sentence—this should not appear in final canonical output.
    return name;
  }

  return `${name} *(${possessiveSubject} vital stats are ${statsText}.)*`;
}

/**
 * Monster-specific validation rules.
 * Monsters require different fields than classed NPCs.
 */
export const MONSTER_VALIDATION_RULES: Array<{
  field: string;
  weight: number;
  type: WarningType;
  message: string;
  suggestion?: string;
}> = [
  {
    field: 'HD',
    weight: 20,
    type: 'warning',
    message: 'Hit Dice (HD) missing for monster. Provide as Level X(dX) format.',
  },
  {
    field: 'Level',
    weight: 20,
    type: 'warning',
    message: 'Level missing for monster. Provide as Level X(dX) format.',
  },
  {
    field: 'Armor Class (AC)',
    weight: 15,
    type: 'warning',
    message: 'Armor Class (AC) missing. Include AC value.',
  },
];

/**
 * Validates a monster stat block against monster-specific formatting rules.
 */
export function buildMonsterValidation(parsed: ParsedNPC): ValidationResult {
  const warnings: ValidationWarning[] = [];
  let score = 100;

  for (const rule of MONSTER_VALIDATION_RULES) {
    // For monsters, check if they have either HD or Level
    if (rule.field === 'HD' || rule.field === 'Level') {
      if (!parsed.fields['HD'] && !parsed.fields['Level']) {
        // Only add one warning for missing HD/Level, not both
        if (rule.field === 'HD') {
          warnings.push({
            type: rule.type,
            category: 'Level/HD',
            message: 'Level or Hit Dice missing for monster. Provide as Level X(dX) format.',
            suggestion: rule.suggestion,
          });
          score -= rule.weight;
        }
      }
    } else if (!parsed.fields[rule.field]) {
      warnings.push({
        type: rule.type,
        category: rule.field,
        message: rule.message,
        suggestion: rule.suggestion,
      });
      score -= rule.weight;
    }
  }

  score = Math.max(0, Math.min(100, score));

  // If both HD/Level and AC are missing, add a critical 'Vital Stats' error so
  // it surfaces separately from the individual HD/AC checks.
  const hdMissing = !parsed.fields['HD'] && !parsed.fields['Level'];
  const acMissing = !parsed.fields['Armor Class (AC)'] && !parsed.fields['AC'];
  if (hdMissing && acMissing) {
    warnings.push({
      type: 'error',
      category: 'Vital Stats',
      message: 'Vital stats are unavailable. Include either Hit Dice (HD) or Level and Armor Class (AC).',
      suggestion: 'Add HD: XdY or Level: X(dY) and Armor Class (AC): <value>',
    });
    score = Math.max(0, score - 25);
  }

  // --- Reforge doctrine flags (QUERY/FLAG tier — surfaced, not silently decided) ---

  // Legacy HD modifier: "5d8+5" -> the +5 is a hit-point bonus, not part of
  // Level. It is stripped by formatHdAsLevel; flag it so the HP contribution
  // is resolved editorially rather than silently dropped.
  const hdField = parsed.fields['HD'] || parsed.fields['Level'];
  if (hdField) {
    const hpModifier = extractHdHpModifier(hdField);
    if (hpModifier) {
      warnings.push({
        type: 'warning',
        category: 'Level/HD',
        message: `HD "${hdField}" contains a legacy hit-point modifier (${hpModifier}). It is stripped from Level, leaving Level ${formatHdAsLevel(hdField)} — resolve it as an HP adjustment; do not fold it into Level.`,
        suggestion: 'Confirm the fixed HP value with the author; the modifier is not part of Level.',
      });
      score -= 3;
    } else if (/^\d+$/.test(hdField.trim())) {
      warnings.push({
        type: 'warning',
        category: 'Level/HD',
        message: `HD "${hdField}" has no die type — kept as Level ${hdField}. A missing die is a source deficiency, not an error to repair.`,
        suggestion: 'Locate an authoritative creature entry or ask the author for the die type; do not invent one.',
      });
      score -= 5;
    }
  }

  // Attack-routine "or" ambiguity: multiple natural attacks each with damage
  // joined by "or" reads as mutually exclusive — mechanical ambiguity (the
  // gargoyle fix). Flag even though applyLightEdits repairs the clear case.
  const original = parsed.original || '';
  if (/attack[^.]*?for\s+\d[^.]*?,\s*or\s+(?:a|an)\s+[^,.]+?\s+for\s+\d/i.test(original)) {
    warnings.push({
      type: 'info',
      category: 'Attacks',
      message: 'Attack routine lists multiple damage-bearing attacks joined by "or" — reads as mutually exclusive. Converted to "and" where unambiguous; verify the full routine is intended per round.',
      suggestion: 'If the creature genuinely alternates attacks, restore "or" for that clause.',
    });
  }

  // Pronoun consistency: a singular block that switches between It/Its and
  // They/Their mid-block is a definite error (e.g., the shadow block).
  const firstLine = original.split(/\r?\n/)[0] ?? '';
  const isUnitBlock = /\b(these|their)\b/i.test(firstLine) || /\bx\s*\d+\b/i.test(firstLine);
  if (!isUnitBlock && /\b(it|its)\b/i.test(original) && /\b(they|their|them)\b/i.test(original)) {
    warnings.push({
      type: 'warning',
      category: 'Pronouns',
      message: 'Singular creature block mixes singular (it/its) and plural (they/their) pronouns — likely an agreement error. A generic singular in a plural block is fine; the reverse is not.',
      suggestion: 'Unify pronouns to match the creature count (or the gendered pronoun for named creatures).',
    });
    score -= 3;
  }

  // Possible comma splice: ", it believes" between two independent clauses.
  // Flagged rather than auto-fixed — subordinate clauses legitimately share
  // this surface pattern ("if hit, it dies").
  if (/,\s+(?:it|he|she|they|this|these)\s+(?:is|are|was|were|has|have|had|can|could|will|would|does|do|did|believes|seems|appears|remains|knows|thinks)\b/i.test(original)) {
    warnings.push({
      type: 'info',
      category: 'Grammar',
      message: 'Possible comma splice (independent clauses joined by a comma). Repair with a semicolon if both clauses are independent.',
    });
  }

  return {
    warnings,
    complianceScore: score,
  };
}

// Helper functions moved to stat-block-helpers.ts
