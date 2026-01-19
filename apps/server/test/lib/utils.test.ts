import { describe, expect, it } from 'vitest';

import { compareString, getNameFromEmail } from '@colanode/server/lib/utils';

describe('utils', () => {
  it('builds display names from email local parts', () => {
    expect(getNameFromEmail('jane.doe@example.com')).toBe('Jane Doe');
    expect(getNameFromEmail('john_doe-smith@example.com')).toBe(
      'John Doe Smith'
    );
  });

  it('compares strings with nulls and undefined', () => {
    expect(compareString('a', 'a')).toBe(0);
    expect(compareString(undefined, 'a')).toBe(-1);
    expect(compareString('a', undefined)).toBe(1);
  });
});
