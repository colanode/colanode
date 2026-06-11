import { describe, expect, it } from 'vitest';

import {
  fieldDefaultToFieldValue,
  generateSchemaDefaultFieldValues,
  mergeFieldValues,
} from '@colanode/core';

describe('field defaults', () => {
  it('converts schema defaults to field values', () => {
    const values = generateSchemaDefaultFieldValues([
      {
        id: 'text-1',
        type: 'text',
        name: 'Title',
        index: 'a0',
        default: 'Untitled',
      },
      {
        id: 'bool-1',
        type: 'boolean',
        name: 'Done',
        index: 'a1',
        default: false,
      },
      {
        id: 'num-1',
        type: 'number',
        name: 'Score',
        index: 'a2',
        default: 3,
      },
    ]);

    expect(values).toEqual({
      'text-1': { type: 'string', value: 'Untitled' },
      'bool-1': { type: 'boolean', value: false },
      'num-1': { type: 'number', value: 3 },
    });
  });

  it('rejects invalid select defaults', () => {
    const value = fieldDefaultToFieldValue({
      id: 'select-1',
      type: 'select',
      name: 'Status',
      index: 'a0',
      default: 'missing-option',
      options: {
        open: {
          id: 'open',
          name: 'Open',
          color: 'blue',
          index: 'a0',
        },
      },
    });

    expect(value).toBeNull();
  });

  it('merges schema defaults with filter overrides', () => {
    const merged = mergeFieldValues(
      {
        'text-1': { type: 'string', value: 'Untitled' },
      },
      {
        'text-1': { type: 'string', value: 'From filter' },
        'bool-1': { type: 'boolean', value: true },
      }
    );

    expect(merged).toEqual({
      'text-1': { type: 'string', value: 'From filter' },
      'bool-1': { type: 'boolean', value: true },
    });
  });
});
