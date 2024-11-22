import { extractNodeCollaborators, Node, NodeTypes } from '@colanode/core';
import { NodeCollaborator } from '@/shared/types/nodes';

export const getDefaultNodeIcon = (type: string) => {
  switch (type) {
    case NodeTypes.Channel:
      return 'discuss-line';
    case NodeTypes.Page:
      return 'book-line';
    case NodeTypes.Database:
      return 'database-2-line';
    case NodeTypes.Record:
      return 'article-line';
    case NodeTypes.Folder:
      return 'folder-open-line';
    case NodeTypes.Space:
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
