import { describe, it, expect } from 'vitest';
import { convertToHtml } from '@/lib/npc-parser';

describe('convertToHtml', () => {
  it('should convert markdown bold and italics to HTML', () => {
    const input = '**Bold** and *italic* text\n\nNext paragraph';
    const html = convertToHtml(input);

    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<p>Next paragraph</p>');
  });

  it('should escape html then convert markdown', () => {
    const input = '<script>alert(1)</script> **Note**';
    const html = convertToHtml(input);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>Note</strong>');
  });
});
