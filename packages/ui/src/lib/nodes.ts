import { NodeCollaborator } from '@colanode/client/types';
import { extractNodeCollaborators, Node } from '@colanode/core';

export const buildNodeCollaborators = (nodes: Node[]): NodeCollaborator[] => {
  const collaborators: Record<string, NodeCollaborator> = {};

  for (const node of nodes) {
    const nodeCollaborators = extractNodeCollaborators(node);

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
