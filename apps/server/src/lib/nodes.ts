import { database } from '@/data/database';
import {
  SelectCollaboration,
  SelectNode,
  SelectNodeTransaction,
} from '@/data/schema';
import { NodeCollaborator } from '@/types/nodes';
import {
  NodeOutput,
  ServerCollaboration,
  ServerNodeTransaction,
} from '@colanode/core';
import {
  extractNodeCollaborators,
  extractNodeRole,
  Node,
  NodeType,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

export const mapNodeOutput = (node: SelectNode): NodeOutput => {
  return {
    id: node.id,
    parentId: node.parent_id,
    workspaceId: node.workspace_id,
    type: node.type,
    attributes: node.attributes,
    state: '',
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    transactionId: node.transaction_id,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
  };
};

export const mapNode = (node: SelectNode): Node => {
  return {
    id: node.id,
    parentId: node.parent_id,
    type: node.type as NodeType,
    attributes: node.attributes,
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
    transactionId: node.transaction_id,
  } as Node;
};

export const mapNodeTransaction = (
  transaction: SelectNodeTransaction
): ServerNodeTransaction => {
  if (transaction.type === 'create' && transaction.data) {
    return {
      id: transaction.id,
      type: 'create',
      nodeId: transaction.node_id,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      number: transaction.number.toString(),
    };
  }

  if (transaction.type === 'update' && transaction.data) {
    return {
      id: transaction.id,
      type: 'update',
      nodeId: transaction.node_id,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      number: transaction.number.toString(),
    };
  }

  if (transaction.type === 'delete') {
    return {
      id: transaction.id,
      type: 'delete',
      nodeId: transaction.node_id,
      workspaceId: transaction.workspace_id,
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      number: transaction.number.toString(),
    };
  }

  throw new Error('Unknown transaction type');
};

export const mapCollaboration = (
  collaboration: SelectCollaboration
): ServerCollaboration => {
  return {
    userId: collaboration.user_id,
    nodeId: collaboration.node_id,
    type: collaboration.type,
    workspaceId: collaboration.workspace_id,
    state: encodeState(collaboration.state),
    createdAt: collaboration.created_at.toISOString(),
    updatedAt: collaboration.updated_at?.toISOString() ?? null,
    deletedAt: collaboration.deleted_at?.toISOString() ?? null,
    number: collaboration.number.toString(),
  };
};

export const fetchNode = async (nodeId: string): Promise<SelectNode | null> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  return result ?? null;
};

export const fetchNodeAncestors = async (
  nodeId: string
): Promise<SelectNode[]> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
    .where('node_paths.descendant_id', '=', nodeId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchNodeDescendants = async (
  nodeId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', nodeId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const fetchNodeCollaborators = async (
  nodeId: string
): Promise<NodeCollaborator[]> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  const collaboratorsMap = new Map<string, string>();

  for (const ancestor of ancestors) {
    const collaborators = extractNodeCollaborators(ancestor.attributes);
    for (const [collaboratorId, role] of Object.entries(collaborators)) {
      collaboratorsMap.set(collaboratorId, role);
    }
  }

  return Array.from(collaboratorsMap.entries()).map(
    ([collaboratorId, role]) => ({
      nodeId: nodeId,
      collaboratorId: collaboratorId,
      role: role,
    })
  );
};

export const fetchNodeRole = async (
  nodeId: string,
  collaboratorId: string
): Promise<string | null> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  if (ancestors.length === 0) {
    return null;
  }

  return extractNodeRole(ancestors.map(mapNode), collaboratorId);
};

export const fetchWorkspaceUsers = async (
  workspaceId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('workspace_users')
    .select('id')
    .where('workspace_id', '=', workspaceId)
    .execute();

  return result.map((row) => row.id);
};
