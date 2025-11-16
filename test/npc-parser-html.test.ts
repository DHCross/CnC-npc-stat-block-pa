import { describe, it, expect } from 'vitest';
import { convertToHtml } from '../src/lib/npc-parser';

describe('convertToHtml', () => {
  it('should convert markdown bold and italics to HTML', () => {
    const input = '**Bold** and *italic* text\n\nNext paragraph';
    const html = convertToHtml(input);

    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<p>Next paragraph</p>');
  });

  it('should convert both ** and __ bold markers to <strong>', () => {
    expect(convertToHtml('**bold**')).toContain('<strong>bold</strong>');
    expect(convertToHtml('__bold__')).toContain('<strong>bold</strong>');
  });

  it('should preserve bold/italic in the real sample', () => {
    const sample = "**This creature's vital stats are HP 23** *disposition neutral*";
    const html = convertToHtml(sample);

    expect(html).toContain('<strong>This creature\'s vital stats are HP 23</strong>');
    expect(html).toContain('<em>disposition neutral</em>');
  });

  it('should escape html then convert markdown', () => {
    const input = '<script>alert(1)</script> **Note**';
    const html = convertToHtml(input);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>Note</strong>');
  });
});
