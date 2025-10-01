import { describe, it, expect } from 'vitest';
import { isUnitHeading } from '../lib/enhanced-parser';
import { processDumpEnhanced } from '../lib/npc-parser';

describe('Unit Detection', () => {
  it('should detect x1 as a unit', () => {
    expect(isUnitHeading('Warrior x1')).toBe(true);
  });

  it('should detect x12 as a unit', () => {
    expect(isUnitHeading('Warrior x12')).toBe(true);
  });

  it('should detect x8 as a unit', () => {
    expect(isUnitHeading('Warrior x8')).toBe(true);
  });

  it('should output plural forms for x1 unit', () => {
    const input = "Warrior x1 (these 3rd level halfling fighters' vital stats are HP 12, AC 13, disposition chaos/neutral. their primary attributes are strength, dexterity, intelligence. they wear leather armor and carry slings and daggers.)";

    const result = processDumpEnhanced(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Warrior x1');

    const converted = result[0].converted;

    // Should use "These" not "This" in parenthetical
    expect(converted).toContain('(These');

    // Should use plural class name
    expect(converted).toContain('fighters');
    expect(converted).not.toContain("fighter’s");

    // Should use possessive plural (U+2019 right single quotation mark)
    expect(converted).toContain("fighters’");

    // Should use "Their" not "His"
    expect(converted).toContain('Their');
    expect(converted).not.toContain('His');

    // Should use "They" not "He"
    expect(converted).toContain('They');
    expect(converted).not.toContain(/\bHe\b/);

    // Should use plural verbs
    expect(converted).toContain('wear');
    expect(converted).toContain('carry');
    expect(converted).not.toContain('wears');
    expect(converted).not.toContain('carries');
  });

  it('should output plural forms for x12 unit', () => {
    const input = "Warrior x12 (these 3rd level human fighters' vital stats are HP 14, AC 15, disposition law/good. their primary attributes are strength, dexterity. they wear chain mail and carry longswords.)";

    const result = processDumpEnhanced(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Warrior x12');

    const converted = result[0].converted;

    expect(converted).toContain('(These');
    expect(converted).toContain('fighters');
    expect(converted).toContain("fighters’");
    expect(converted).toContain('Their');
    expect(converted).toContain('They');
    expect(converted).toContain('wear');
    expect(converted).toContain('carry');
  });

  it('should output singular forms for individual NPC', () => {
    const input = "Sir Galahad (this 5th level human fighter's vital stats are HP 32, AC 17, disposition law/good. his primary attributes are strength, constitution. he wears plate mail and carries a longsword.)";

    const result = processDumpEnhanced(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sir Galahad');

    const converted = result[0].converted;

    // Should use "This" not "These" in parenthetical
    expect(converted).toContain('(This');

    // Should use singular class name
    expect(converted).toContain("fighter’s");
    expect(converted).not.toContain("fighters'");

    // Should use "He" not "They"
    expect(converted).toContain('He');
    expect(converted).not.toContain(/\bThey\b/);
    expect(converted).not.toContain('Their');

    // Should use singular verbs
    expect(converted).toContain('wears');
    expect(converted).toContain('carries');
    expect(converted).not.toContain(/\bwear\b/);
    expect(converted).not.toContain(/\bcarry\b/);
  });
});
