import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { useCallback, useMemo } from 'react';

import { LocalNode } from '@colanode/client/types';
import { FieldAttributes, FieldValue } from '@colanode/core';
import { useEntityFields } from '@colanode/ui/contexts/entity-fields';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface Options {
  field: FieldAttributes;
}

export const useEntityField = <T extends FieldValue>({ field }: Options) => {
  const entity = useEntityFields();
  const workspace = useWorkspace();

  const mutate = usePacedMutations<T | null, LocalNode>({
    onMutate: (nextValue) => {
      workspace.collections.nodes.update(entity.id, (draft) => {
        if (entity.entityType === 'record') {
          if (draft.type !== 'record') {
            return;
          }

          const fields = draft.fields ?? {};

          if (nextValue === null) {
            const { [field.id]: _removed, ...rest } = fields;
            draft.fields = rest;
          } else {
            draft.fields = {
              ...fields,
              [field.id]: nextValue,
            };
          }

          return;
        }

        if (draft.type !== 'page') {
          return;
        }

        const fields = draft.fields ?? {};

        if (nextValue === null) {
          const { [field.id]: _removed, ...rest } = fields;
          draft.fields =
            Object.keys(rest).length === 0 ? undefined : rest;
        } else {
          draft.fields = {
            ...fields,
            [field.id]: nextValue,
          };
        }
      });
    },
    mutationFn: async ({ transaction }) => {
      await applyNodeTransaction(workspace.userId, transaction);
    },
    strategy: debounceStrategy({ wait: 500 }),
  });

  const value = useMemo(() => {
    return (entity.fields[field.id] as T | undefined) ?? null;
  }, [entity.fields, field.id]) as T | null;

  const setValue = useCallback((next: T) => mutate(next), [mutate]);
  const clearValue = useCallback(() => mutate(null), [mutate]);

  return { value, setValue, clearValue };
};
