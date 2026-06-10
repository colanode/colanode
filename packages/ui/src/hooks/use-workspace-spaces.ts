import { eq, useLiveQuery } from '@tanstack/react-db';
import { useMemo } from 'react';

import { LocalSpaceNode } from '@colanode/client/types';
import { META_TYPES_SPACE_MARKER } from '@colanode/core';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const useWorkspaceSpaces = () => {
  const workspace = useWorkspace();

  const query = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'space'))
        .orderBy(({ nodes }) => nodes.id, 'asc'),
    [workspace.userId]
  );

  const spaces = useMemo(
    () =>
      (query.data ?? [])
        .filter((node) => node.type === 'space')
        .map((node) => node as unknown as LocalSpaceNode)
        .filter((space) => space.description !== META_TYPES_SPACE_MARKER),
    [query.data]
  );

  return {
    isLoading: query.isLoading,
    spaces,
  };
};
