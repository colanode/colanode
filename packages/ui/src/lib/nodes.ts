import { OperationType, TransactionWithMutations } from '@tanstack/react-db';
import { cloneDeep } from 'lodash-es';

import { mapNodeAttributes } from '@colanode/client/lib';
import {
  LocalNode,
  NodeCollaborator,
  NodeReaction,
} from '@colanode/client/types';
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

export const applyNodeTransaction = async (
  userId: string,
  transaction: TransactionWithMutations<LocalNode, OperationType>
) => {
  for (const mutation of transaction.mutations) {
    if (mutation.type === 'insert') {
      const node = mutation.modified;
      const attributes = mapNodeAttributes(node);
      await window.colanode.executeMutation({
        type: 'node.create',
        userId,
        nodeId: node.id,
        attributes,
      });
    } else if (mutation.type === 'update') {
      const node = cloneDeep(mutation.modified);
      const attributes = mapNodeAttributes(node);
      await window.colanode.executeMutation({
        type: 'node.update',
        userId,
        nodeId: mutation.key,
        attributes,
      });
    } else if (mutation.type === 'delete') {
      await window.colanode.executeMutation({
        type: 'node.delete',
        userId,
        nodeId: mutation.key,
      });
    }
  }
};

export const applyNodeReactionTransaction = async (
  userId: string,
  transaction: TransactionWithMutations<NodeReaction, OperationType>
) => {
  for (const mutation of transaction.mutations) {
    if (mutation.type === 'insert') {
      const reaction = mutation.modified;
      await window.colanode.executeMutation({
        type: 'node.reaction.create',
        userId,
        nodeId: reaction.nodeId,
        collaboratorId: reaction.collaboratorId,
        reaction: reaction.reaction,
      });
    } else if (mutation.type === 'delete') {
      const reaction = mutation.modified;
      await window.colanode.executeMutation({
        type: 'node.reaction.delete',
        userId,
        nodeId: reaction.nodeId,
        collaboratorId: reaction.collaboratorId,
        reaction: reaction.reaction,
      });
    }
  }
};

export const buildNodeReactionKey = (
  nodeId: string,
  collaboratorId: string,
  reaction: string
) => {
  return `${nodeId}.${collaboratorId}.${reaction}`;
};
