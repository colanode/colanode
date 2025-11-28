import { createContext, useContext } from 'react';

import { LocalNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';

export type NodeContextValue<T extends LocalNode = LocalNode> = {
  node: T;
  breadcrumb: LocalNode[];
  root: LocalNode;
  role: NodeRole;
};

export const NodeContext = createContext<NodeContextValue | null>(null);

export const useNode = <T extends LocalNode = LocalNode>() => {
  const context = useContext(NodeContext) as NodeContextValue<T> | null;

  if (!context) {
    throw new Error('useNode must be used within a NodeProvider');
  }

  return context;
};
