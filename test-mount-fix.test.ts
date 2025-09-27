import { describe, it, expect } from 'vitest';
import { processDumpEnhanced } from './src/lib/npc-parser';

describe('Mount Extraction Fix', () => {
  it('should separate mounts into dedicated blocks', () => {
    const input = 'Knight (human fighter, HP 35, AC 18, rides heavy war horse HP 40, AC 19, 2 hooves 1d4)';
    const result = processDumpEnhanced(input);

    console.log('Result:', result[0].converted);

    // Should have separate mount block
    expect(result[0].converted).toContain('**');
    expect(result[0].converted).toContain('(mount)');

    // Mount data should be removed from rider
    expect(result[0].converted).not.toContain('rides heavy war horse');
  });
});