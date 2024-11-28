import { database } from '@/data/database';
import {
  SelectCollaborationRevocation,
  SelectNode,
  SelectNodeTransaction,
} from '@/data/schema';
import { NodeCollaborator } from '@/types/nodes';
import {
  NodeOutput,
  NodeRole,
  ServerCollaborationRevocation,
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
  if (transaction.operation === 'create' && transaction.data) {
    return {
      id: transaction.id,
      operation: 'create',
      nodeId: transaction.node_id,
      nodeType: transaction.node_type,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  if (transaction.operation === 'update' && transaction.data) {
    return {
      id: transaction.id,
      operation: 'update',
      nodeId: transaction.node_id,
      nodeType: transaction.node_type,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  if (transaction.operation === 'delete') {
    return {
      id: transaction.id,
      operation: 'delete',
      nodeId: transaction.node_id,
      nodeType: transaction.node_type,
      workspaceId: transaction.workspace_id,
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  throw new Error('Unknown transaction type');
};

export const mapCollaborationRevocation = (
  revocation: SelectCollaborationRevocation
): ServerCollaborationRevocation => {
  return {
    userId: revocation.user_id,
    nodeId: revocation.node_id,
    workspaceId: revocation.workspace_id,
    createdAt: revocation.created_at.toISOString(),
    version: revocation.version.toString(),
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
): Promise<NodeRole | null> => {
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
