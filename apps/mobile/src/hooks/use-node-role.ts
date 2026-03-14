import { extractNodeRole, hasNodeRole, NodeRole } from '@colanode/core';
import { LocalNode, LocalSpaceNode } from '@colanode/client/types/nodes';

import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';

export const useNodeRole = (
  userId: string,
  node: LocalNode | undefined
): { role: NodeRole | null; canEdit: boolean; isLoading: boolean } => {
  const rootId = node?.rootId;

  const { data: rootNode, isLoading } = useNodeQuery<LocalSpaceNode>(
    userId,
    rootId,
    'space'
  );

  if (!rootNode || !node) {
    return { role: null, canEdit: false, isLoading };
  }

  const role = extractNodeRole(rootNode, userId);
  const canEdit = role ? hasNodeRole(role, 'editor') : false;

  return { role, canEdit, isLoading };
};
