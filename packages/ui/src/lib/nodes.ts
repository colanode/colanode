import { NodeCollaborator } from '@colanode/client/types';
import { extractNodeCollaborators, Node, NodeType } from '@colanode/core';

export const getDefaultNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'channel':
      return 'discuss-line';
    case 'page':
      return 'book-line';
    case 'database':
      return 'database-2-line';
    case 'record':
      return 'article-line';
    case 'folder':
      return 'folder-open-line';
    case 'space':
      return 'team-line';
    default:
      return 'file-unknown-line';
  }
};

export const buildNodeCollaborators = (nodes: Node[]): NodeCollaborator[] => {
  const collaborators: Record<string, NodeCollaborator> = {};

  for (const node of nodes) {
    const nodeCollaborators = extractNodeCollaborators(node.attributes);

    for (const [collaboratorId, role] of Object.entries(nodeCollaborators)) {
      collaborators[collaboratorId] = {
        nodeId: node.id,
        collaboratorId,
        role,
      };
    }
  }

  return Object.values(collaborators);
};
