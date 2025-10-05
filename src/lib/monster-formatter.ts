// Monster stat block formatter module
// This module handles formatting for full-fledged monster stat blocks,
// NOT NPCs, NPC units, or units of non-humans with character classes.
//
// Key distinguishing features of monsters:
// - Use HD (Hit Dice) instead of levels
// - Have monster-specific fields: TREASURE, XP, SAVES, TYPE, ALIGNMENT
// - Do not have character classes (fighter, wizard, etc.)
// - Follow different formatting rules than classed NPCs

import type { ParsedNPC, ValidationResult, ValidationWarning, WarningType } from './stat-block-types';
import { buildSubjectDescriptor, normalizeDisposition, toPossessiveSubject } from './stat-block-helpers';

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

  // Level/HD
  const level = parsed.fields['Level'] || parsed.fields['HD'];
  if (level) {
    statParts.push(`Level ${level}`);
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
  const vitalSection = statsText
    ? `${possessiveSubject} vital stats are ${statsText}.`
    : `${possessiveSubject} vital stats are unavailable.`;

  return `${name} *(${vitalSection})*`;
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

  return {
    warnings,
    complianceScore: score,
  };
}

// Helper functions moved to stat-block-helpers.ts
