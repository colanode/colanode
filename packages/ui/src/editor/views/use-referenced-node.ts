import { eq, useLiveQuery } from '@tanstack/react-db';

import type { LocalNode } from '@colanode/client/types';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const useReferencedNode = <T extends LocalNode>(
  nodeId: string | undefined
): { node: T | null; isLoading: boolean } => {
  const workspace = useWorkspace();

  const query = useLiveQuery(
    (q) =>
      nodeId
        ? q
            .from({ nodes: workspace.collections.nodes })
            .where(({ nodes }) => eq(nodes.id, nodeId))
            .findOne()
        : q.from({ nodes: workspace.collections.nodes }).where(() => false).findOne(),
    [workspace.userId, nodeId]
  );

  if (!nodeId) {
    return { node: null, isLoading: false };
  }

  return {
    node: (query.data as T | undefined) ?? null,
    isLoading: query.isLoading,
  };
};
