import { LocalSpaceNode } from '@colanode/client/types/nodes';
import { extractNodeRole, NodeRole } from '@colanode/core';

import { useNodeQuery } from '@colanode/mobile/hooks/use-node-query';

export const useNodeRole = (
  userId: string,
  rootId: string | undefined
): NodeRole | null => {
  const { data: rootSpace } = useNodeQuery<LocalSpaceNode>(
    userId,
    rootId,
    'space'
  );

  if (!rootSpace) {
    return null;
  }

  return extractNodeRole(rootSpace, userId);
};
