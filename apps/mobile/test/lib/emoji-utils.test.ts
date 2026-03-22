import { codeToEmoji } from '@colanode/mobile/lib/emoji-utils';

describe('codeToEmoji', () => {
  it('should convert a single hex code to emoji', () => {
    expect(codeToEmoji('1f600')).toBe('\u{1F600}'); // 😀
  });

  it('should convert a compound code with dashes', () => {
    // Flag: US (regional indicators U + S)
    expect(codeToEmoji('1f1fa-1f1f8')).toBe('\u{1F1FA}\u{1F1F8}');
  });

  it('should handle simple ASCII-range code points', () => {
    expect(codeToEmoji('41')).toBe('A');
  });

  it('should return ? for invalid hex', () => {
    expect(codeToEmoji('xyz')).toBe('?');
  });

  it('should return empty string for empty input', () => {
    expect(codeToEmoji('')).toBe('');
  });

  it('should ignore extra dashes', () => {
    expect(codeToEmoji('1f600-')).toBe('\u{1F600}');
    expect(codeToEmoji('-1f600')).toBe('\u{1F600}');
  });
});
