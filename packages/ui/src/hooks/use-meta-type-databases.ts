import { eq, useLiveQuery } from '@tanstack/react-db';
import { useMemo } from 'react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { DEFAULT_PAGE_META_TYPE_NAME } from '@colanode/core';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const useMetaTypeDatabases = () => {
  const workspace = useWorkspace();

  const query = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database'))
        .select(({ nodes }) => nodes),
    [workspace.userId]
  );

  const metaTypes = useMemo(() => {
    return (query.data ?? [])
      .filter((node) => node.type === 'database')
      .map((node) => node as unknown as LocalDatabaseNode)
      .filter((node) => (node.purpose ?? 'records') === 'meta_type');
  }, [query.data]);

  const defaultPageMetaType = useMemo(
    () =>
      metaTypes.find((metaType) => metaType.name === DEFAULT_PAGE_META_TYPE_NAME) ??
      metaTypes[0] ??
      null,
    [metaTypes]
  );

  return {
    isLoading: query.isLoading,
    metaTypes,
    defaultPageMetaType,
  };
};
