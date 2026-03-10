import { LocalNode } from '@colanode/client/types/nodes';

export const getNodeDisplayName = (node: LocalNode): string => {
  switch (node.type) {
    case 'chat':
      return 'Chat';
    default:
      return node.name || node.type;
  }
};
