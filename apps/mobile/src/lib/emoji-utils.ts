export const codeToEmoji = (code: string): string => {
  try {
    const parts = code.split('-').filter((p) => p.length > 0);
    const codePoints = parts.map((p) => parseInt(p, 16));
    if (codePoints.some((cp) => isNaN(cp))) return '?';
    return String.fromCodePoint(...codePoints);
  } catch {
    return '?';
  }
};
