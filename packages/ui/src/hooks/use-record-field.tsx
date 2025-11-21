import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { useCallback, useMemo } from 'react';

import { LocalNode } from '@colanode/client/types';
import { FieldAttributes, FieldValue } from '@colanode/core';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface Options {
  field: FieldAttributes;
}

export const useRecordField = <T extends FieldValue>({ field }: Options) => {
  const record = useRecord();
  const workspace = useWorkspace();

  const mutate = usePacedMutations<T | null, LocalNode>({
    onMutate: (nextValue) => {
      workspace.collections.nodes.update(record.id, (draft) => {
        if (draft.type !== 'record') return;
        if (nextValue === null) {
          const { [field.id]: _removed, ...rest } = draft.fields;
          draft.fields = rest;
        } else {
          draft.fields[field.id] = nextValue;
        }
      });
    },
    mutationFn: async ({ transaction }) => {
      await applyNodeTransaction(workspace.userId, transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

  const value = useMemo(() => {
    return (record.fields[field.id] as T | undefined) ?? null;
  }, [record.fields, field.id]) as T | null;

  const setValue = useCallback((next: T) => mutate(next), [mutate]);
  const clearValue = useCallback(() => mutate(null), [mutate]);

  return { value, setValue, clearValue };
};
