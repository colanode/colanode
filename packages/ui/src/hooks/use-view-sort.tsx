import { debounceStrategy, usePacedMutations } from '@tanstack/react-db';
import { useCallback } from 'react';

import { LocalNode } from '@colanode/client/types';
import { DatabaseViewSortAttributes } from '@colanode/core';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

interface Options {
  viewId: string;
  sortId: string;
}

export const useViewSort = ({ viewId, sortId }: Options) => {
  const workspace = useWorkspace();

  const mutate = usePacedMutations<DatabaseViewSortAttributes | null, LocalNode>(
    {
      onMutate: (nextSort) => {
        workspace.collections.nodes.update(viewId, (draft) => {
          if (draft.type !== 'database_view') return;

          if (nextSort === null) {
            const { [sortId]: _removed, ...rest } = draft.sorts ?? {};
            draft.sorts = Object.keys(rest).length > 0 ? rest : undefined;
            return;
          }

          draft.sorts = {
            ...(draft.sorts ?? {}),
            [sortId]: { ...nextSort, id: sortId },
          };
        });
      },
      mutationFn: async ({ transaction }) => {
        await applyNodeTransaction(workspace.userId, transaction);
      },
      strategy: debounceStrategy({ wait: 500 }),
    }
  );

  const updateSort = useCallback(
    (nextSort: DatabaseViewSortAttributes) => mutate(nextSort),
    [mutate]
  );

  const removeSort = useCallback(() => mutate(null), [mutate]);

  return { updateSort, removeSort };
};
