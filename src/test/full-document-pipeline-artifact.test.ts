import { describe, it, expect } from 'vitest';
import { sanitizeConvertedString } from '../lib/full-document-pipeline';
import { mouthsOfMadnessAnalysis } from '@/components/mocks/mouths-of-madness.mock';

describe('Full Document Pipeline artifact cleanup', () => {
  it('should remove starred artifact with curly apostrophe', () => {
    const input = 'Bold text. *(This creature’s vital stats are unavailable.)* More text.';
    const out = sanitizeConvertedString(input);
    expect(out).toBe('Bold text. More text.');
  });

  it('should remove plain artifact with straight apostrophe and no stars', () => {
    const input = 'Mount details. (This creature\'s vital stats are unavailable.)';
    const out = sanitizeConvertedString(input);
    expect(out).toBe('Mount details.');
  });

  it('should collapse duplicate whitespace and trim', () => {
    const input = '  A line  with   lots  of space. *(This creature’s vital stats are unavailable.)*  \n\n';
    const out = sanitizeConvertedString(input);
    expect(out).toBe('A line with lots of space.');
  });

  it('sanitized mock converted strings should not contain the artifact', () => {
    const regex = /\*?\(This creature[’']s vital stats are unavailable\.\)\*?/i;
    for (const creature of (mouthsOfMadnessAnalysis as any).creatures) {
      expect(regex.test(creature.converted)).toBe(false);
    }
  });
});
