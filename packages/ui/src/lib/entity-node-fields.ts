import { LocalNode } from '@colanode/client/types';
import { FieldValue } from '@colanode/core';

export const applyFieldValueToNode = (
  draft: LocalNode,
  fieldId: string,
  value: FieldValue | null
): void => {
  if (draft.type !== 'record' && draft.type !== 'page') {
    return;
  }

  const fields = draft.fields ?? {};

  if (value === null) {
    const { [fieldId]: _removed, ...rest } = fields;

    if (draft.type === 'page') {
      draft.fields = Object.keys(rest).length === 0 ? undefined : rest;
    } else {
      draft.fields = rest;
    }

    return;
  }

  draft.fields = {
    ...fields,
    [fieldId]: value,
  };
};
