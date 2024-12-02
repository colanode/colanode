import {
  extractNodeCollaborators,
  generateId,
  IdType,
  NodeAttributes,
  NodeMutationContext,
  NodeRole,
  registry,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { sql, Transaction } from 'kysely';
import { cloneDeep } from 'lodash-es';

import { database } from '@/data/database';
import {
  CreateCollaboration,
  CreateNode,
  CreateNodeTransaction,
  DatabaseSchema,
  SelectWorkspaceUser,
} from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { fetchNodeAncestors, mapNode } from '@/lib/nodes';
import { createLogger } from '@/lib/logger';
import {
  ApplyNodeCreateTransactionInput,
  ApplyNodeCreateTransactionOutput,
  ApplyNodeDeleteTransactionInput,
  ApplyNodeDeleteTransactionOutput,
  ApplyNodeUpdateTransactionInput,
  ApplyNodeUpdateTransactionOutput,
  CreateNodeInput,
  CreateNodeOutput,
  UpdateNodeInput,
  UpdateNodeOutput,
} from '@/types/nodes';

const UPDATE_RETRIES_LIMIT = 10;

type UpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};

type CollaboratorChangeResult = {
  addedCollaborators: Record<string, NodeRole>;
  updatedCollaborators: Record<string, NodeRole>;
  removedCollaborators: Record<string, NodeRole>;
};

class NodeService {
  private readonly logger = createLogger('node-service');

  public async createNode(
    input: CreateNodeInput
  ): Promise<CreateNodeOutput | null> {
    const model = registry.getNodeModel(input.attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(model.schema, input.attributes);
    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const createNode: CreateNode = {
      id: input.nodeId,
      workspace_id: input.workspaceId,
      attributes: attributesJson,
      created_at: date,
      created_by: input.userId,
      transaction_id: transactionId,
    };

    const createTransaction: CreateNodeTransaction = {
      id: transactionId,
      node_id: input.nodeId,
      node_type: input.attributes.type,
      workspace_id: input.workspaceId,
      operation: 'create',
      data: update,
      created_at: date,
      created_by: input.userId,
      server_created_at: date,
    };

    try {
      const { createdNode, createdTransaction } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createNode,
          createTransaction
        );

      eventBus.publish({
        type: 'node_created',
        nodeId: input.nodeId,
        nodeType: input.attributes.type,
        workspaceId: input.workspaceId,
      });

      return {
        node: createdNode,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to create node transaction');
      return null;
    }
  }

  public async updateNode(
    input: UpdateNodeInput
  ): Promise<UpdateNodeOutput | null> {
    let count = 0;
    while (count < UPDATE_RETRIES_LIMIT) {
      const result = await this.tryUpdateNode(input);

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }

      count++;
    }

    return null;
  }

  private async tryUpdateNode(
    input: UpdateNodeInput
  ): Promise<UpdateResult<UpdateNodeOutput>> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);

    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('node_transactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const transaction of previousTransactions) {
      if (transaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(transaction.data);
    }

    const currentAttributes = ydoc.getAttributes<NodeAttributes>();
    const updatedAttributes = input.updater(cloneDeep(currentAttributes));
    if (!updatedAttributes) {
      return { type: 'error', output: null };
    }

    const model = registry.getNodeModel(updatedAttributes.type);
    const update = ydoc.updateAttributes(model.schema, updatedAttributes);

    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const collaboratorChanges = this.checkCollaboratorChanges(
      node.attributes,
      attributes
    );

    try {
      const { updatedNode, createdTransaction } = await database
        .transaction()
        .execute(async (trx) => {
          const updatedNode = await trx
            .updateTable('nodes')
            .returningAll()
            .set({
              attributes: attributesJson,
              updated_at: date,
              updated_by: input.userId,
              transaction_id: transactionId,
            })
            .where('id', '=', input.nodeId)
            .where('transaction_id', '=', node.transactionId)
            .executeTakeFirst();

          if (!updatedNode) {
            throw new Error('Failed to update node');
          }

          const createdTransaction = await trx
            .insertInto('node_transactions')
            .returningAll()
            .values({
              id: transactionId,
              node_id: input.nodeId,
              node_type: node.type,
              workspace_id: input.workspaceId,
              operation: 'update',
              data: update,
              created_at: date,
              created_by: input.userId,
              server_created_at: date,
            })
            .executeTakeFirst();

          if (!createdTransaction) {
            throw new Error('Failed to create transaction');
          }

          await this.applyCollaborationUpdates(
            trx,
            input.nodeId,
            collaboratorChanges
          );

          return {
            updatedNode,
            createdTransaction,
          };
        });

      eventBus.publish({
        type: 'node_updated',
        nodeId: input.nodeId,
        nodeType: node.type,
        workspaceId: input.workspaceId,
      });

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyNodeCreateTransaction(
    workspaceUser: SelectWorkspaceUser,
    input: ApplyNodeCreateTransactionInput
  ): Promise<ApplyNodeCreateTransactionOutput | null> {
    const ydoc = new YDoc();
    ydoc.applyUpdate(input.data);
    const attributes = ydoc.getAttributes<NodeAttributes>();

    const ancestorRows = attributes.parentId
      ? await fetchNodeAncestors(attributes.parentId)
      : [];

    const ancestors = ancestorRows.map(mapNode);
    const context = new NodeMutationContext(
      workspaceUser.account_id,
      workspaceUser.workspace_id,
      workspaceUser.id,
      workspaceUser.role,
      ancestors
    );

    const model = registry.getNodeModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return null;
    }

    if (!model.canCreate(context, attributes)) {
      return null;
    }

    const createNode: CreateNode = {
      id: input.nodeId,
      attributes: JSON.stringify(attributes),
      workspace_id: context.workspaceId,
      created_at: input.createdAt,
      created_by: context.userId,
      transaction_id: input.id,
    };

    const createTransaction: CreateNodeTransaction = {
      id: input.id,
      node_id: input.nodeId,
      node_type: attributes.type,
      workspace_id: context.workspaceId,
      operation: 'create',
      data:
        typeof input.data === 'string' ? decodeState(input.data) : input.data,
      created_at: input.createdAt,
      created_by: context.userId,
      server_created_at: new Date(),
    };

    try {
      const { createdNode, createdTransaction } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createNode,
          createTransaction
        );

      eventBus.publish({
        type: 'node_created',
        nodeId: input.nodeId,
        nodeType: attributes.type,
        workspaceId: context.workspaceId,
      });

      return {
        node: createdNode,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to apply node create transaction');
      return null;
    }
  }

  public async applyNodeUpdateTransaction(
    workspaceUser: SelectWorkspaceUser,
    input: ApplyNodeUpdateTransactionInput
  ): Promise<ApplyNodeUpdateTransactionOutput | null> {
    let count = 0;
    while (count < UPDATE_RETRIES_LIMIT) {
      const result = await this.tryApplyNodeUpdateTransaction(
        workspaceUser,
        input
      );

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }

      count++;
    }

    return null;
  }

  private async tryApplyNodeUpdateTransaction(
    workspaceUser: SelectWorkspaceUser,
    input: ApplyNodeUpdateTransactionInput
  ): Promise<UpdateResult<ApplyNodeUpdateTransactionOutput>> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);

    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('node_transactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .orderBy('version', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    ydoc.applyUpdate(input.data);

    const attributes = ydoc.getAttributes<NodeAttributes>();
    const attributesJson = JSON.stringify(attributes);
    const model = registry.getNodeModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return { type: 'error', output: null };
    }

    const context = new NodeMutationContext(
      workspaceUser.account_id,
      workspaceUser.workspace_id,
      workspaceUser.id,
      workspaceUser.role,
      ancestors
    );

    if (!model.canUpdate(context, node, attributes)) {
      return { type: 'error', output: null };
    }

    const collaboratorChanges = this.checkCollaboratorChanges(
      node.attributes,
      attributes
    );

    try {
      const { updatedNode, createdTransaction } = await database
        .transaction()
        .execute(async (trx) => {
          const updatedNode = await trx
            .updateTable('nodes')
            .returningAll()
            .set({
              attributes: attributesJson,
              updated_at: input.createdAt,
              updated_by: input.userId,
              transaction_id: input.id,
            })
            .where('id', '=', input.nodeId)
            .where('transaction_id', '=', node.transactionId)
            .executeTakeFirst();

          if (!updatedNode) {
            throw new Error('Failed to update node');
          }

          const createdTransaction = await trx
            .insertInto('node_transactions')
            .returningAll()
            .values({
              id: input.id,
              node_id: input.nodeId,
              workspace_id: context.workspaceId,
              node_type: node.type,
              operation: 'update',
              data:
                typeof input.data === 'string'
                  ? decodeState(input.data)
                  : input.data,
              created_at: input.createdAt,
              created_by: input.userId,
              server_created_at: new Date(),
            })
            .executeTakeFirst();

          if (!createdTransaction) {
            throw new Error('Failed to create transaction');
          }

          await this.applyCollaborationUpdates(
            trx,
            input.nodeId,
            collaboratorChanges
          );

          return {
            updatedNode,
            createdTransaction,
          };
        });

      eventBus.publish({
        type: 'node_updated',
        nodeId: input.nodeId,
        nodeType: node.type,
        workspaceId: context.workspaceId,
      });

      const addedCollaboratorIds = Object.keys(
        collaboratorChanges.addedCollaborators
      );

      if (addedCollaboratorIds.length > 0) {
        for (const userId of addedCollaboratorIds) {
          eventBus.publish({
            type: 'collaborator_added',
            userId,
            nodeId: input.nodeId,
          });
        }
      }

      const removedCollaboratorIds = Object.keys(
        collaboratorChanges.removedCollaborators
      );

      if (removedCollaboratorIds.length > 0) {
        for (const userId of removedCollaboratorIds) {
          eventBus.publish({
            type: 'collaborator_removed',
            userId,
            nodeId: input.nodeId,
          });
        }
      }

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyNodeDeleteTransaction(
    workspaceUser: SelectWorkspaceUser,
    input: ApplyNodeDeleteTransactionInput
  ): Promise<ApplyNodeDeleteTransactionOutput | null> {
    const ancestorRows = await fetchNodeAncestors(input.nodeId);
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === input.nodeId);
    if (!node) {
      return null;
    }

    const model = registry.getNodeModel(node.attributes.type);
    const context = new NodeMutationContext(
      workspaceUser.account_id,
      workspaceUser.workspace_id,
      workspaceUser.id,
      workspaceUser.role,
      ancestors
    );

    if (!model.canDelete(context, node)) {
      return null;
    }

    const { deletedNode, createdTransaction } = await database
      .transaction()
      .execute(async (trx) => {
        const deletedNode = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', input.nodeId)
          .executeTakeFirst();

        if (!deletedNode) {
          throw new Error('Failed to delete node');
        }

        await trx
          .deleteFrom('node_transactions')
          .where('node_id', '=', input.nodeId)
          .execute();

        const createdTransaction = await trx
          .insertInto('node_transactions')
          .returningAll()
          .values({
            id: input.id,
            node_id: input.nodeId,
            workspace_id: workspaceUser.workspace_id,
            node_type: node.type,
            operation: 'delete',
            created_at: input.createdAt,
            created_by: workspaceUser.id,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        return {
          deletedNode,
          createdTransaction,
        };
      });

    eventBus.publish({
      type: 'node_deleted',
      nodeId: input.nodeId,
      nodeType: node.type,
      workspaceId: workspaceUser.workspace_id,
    });

    return {
      node: deletedNode,
      transaction: createdTransaction,
    };
  }

  private async applyDatabaseCreateTransaction(
    attributes: NodeAttributes,
    node: CreateNode,
    transaction: CreateNodeTransaction
  ) {
    const collaborationsToCreate: CreateCollaboration[] = Object.entries(
      extractNodeCollaborators(attributes)
    ).map(([userId, role]) => ({
      user_id: userId,
      node_id: node.id,
      workspace_id: node.workspace_id,
      roles: JSON.stringify({ [node.id]: role }),
      created_at: new Date(),
    }));

    return await database.transaction().execute(async (trx) => {
      const createdNode = await trx
        .insertInto('nodes')
        .returningAll()
        .values(node)
        .executeTakeFirst();

      if (!createdNode) {
        throw new Error('Failed to create node');
      }

      const createdTransaction = await trx
        .insertInto('node_transactions')
        .returningAll()
        .values(transaction)
        .executeTakeFirst();

      if (!createdTransaction) {
        throw new Error('Failed to create transaction');
      }

      if (collaborationsToCreate.length > 0) {
        const createdCollaborations = await trx
          .insertInto('collaborations')
          .returningAll()
          .values(collaborationsToCreate)
          .execute();

        if (createdCollaborations.length !== collaborationsToCreate.length) {
          throw new Error('Failed to create collaborations');
        }
      }

      await sql`
        INSERT INTO collaborations (user_id, node_id, workspace_id, roles, created_at)
        SELECT 
          c.user_id,
          ${node.id} as node_id,
          ${node.workspace_id} as workspace_id,
          c.roles,
          ${new Date()} as created_at
        FROM collaborations as c
        WHERE c.node_id = ${attributes.parentId}
        ON CONFLICT (user_id, node_id) DO UPDATE
        SET
          roles = collaborations.roles || EXCLUDED.roles,
          updated_at = NOW()
      `.execute(trx);

      return { createdNode, createdTransaction };
    });
  }

  private async applyCollaborationUpdates(
    transaction: Transaction<DatabaseSchema>,
    nodeId: string,
    updateResult: CollaboratorChangeResult
  ) {
    for (const [userId, role] of Object.entries(
      updateResult.addedCollaborators
    )) {
      const roles = JSON.stringify({ [nodeId]: role });
      await sql`
        INSERT INTO collaborations (user_id, node_id, workspace_id, roles, created_at)
        SELECT 
          ${userId} as user_id,
          np.descendant_id as node_id,
          np.workspace_id as workspace_id,
          ${roles},
          ${new Date()} as created_at
        FROM node_paths as np
        WHERE np.ancestor_id = ${nodeId}
        ON CONFLICT (user_id, node_id) DO UPDATE
        SET
          roles = collaborations.roles || EXCLUDED.roles,
          updated_at = NOW()
      `.execute(transaction);
    }

    for (const [userId, role] of Object.entries(
      updateResult.updatedCollaborators
    )) {
      const roles = JSON.stringify({ [nodeId]: role });
      await sql`
        INSERT INTO collaborations (user_id, node_id, workspace_id, roles, created_at)
        SELECT 
          ${userId} as user_id,
          np.descendant_id as node_id,
          np.workspace_id as workspace_id,
          ${roles},
          ${new Date()} as created_at
        FROM node_paths as np
        WHERE np.ancestor_id = ${nodeId}
        ON CONFLICT (user_id, node_id) DO UPDATE
        SET
          roles = collaborations.roles || EXCLUDED.roles,
          updated_at = NOW()
      `.execute(transaction);
    }

    const removedCollaboratorIds = Object.keys(
      updateResult.removedCollaborators
    );

    if (removedCollaboratorIds.length > 0) {
      await sql`
        UPDATE collaborations
        SET
          roles = collaborations.roles - ${nodeId},
          updated_at = NOW()
        WHERE user_id IN (${sql.join(removedCollaboratorIds, sql`, `)}) 
        AND node_id IN 
          (
            SELECT np.descendant_id 
            FROM node_paths as np 
            WHERE np.ancestor_id = ${nodeId}
          )
      `.execute(transaction);
    }
  }

  private checkCollaboratorChanges(
    beforeAttributes: NodeAttributes,
    afterAttributes: NodeAttributes
  ): CollaboratorChangeResult {
    const beforeCollaborators = extractNodeCollaborators(beforeAttributes);
    const afterCollaborators = extractNodeCollaborators(afterAttributes);

    const addedCollaborators: Record<string, NodeRole> = {};
    const updatedCollaborators: Record<string, NodeRole> = {};
    const removedCollaborators: Record<string, NodeRole> = {};

    // Check for added and updated collaborators
    for (const [userId, newRole] of Object.entries(afterCollaborators)) {
      if (!(userId in beforeCollaborators)) {
        addedCollaborators[userId] = newRole;
      } else if (beforeCollaborators[userId] !== newRole) {
        updatedCollaborators[userId] = newRole;
      }
    }

    // Check for removed collaborators
    for (const [userId, oldRole] of Object.entries(beforeCollaborators)) {
      if (!(userId in afterCollaborators)) {
        removedCollaborators[userId] = oldRole;
      }
    }

    return {
      addedCollaborators,
      updatedCollaborators,
      removedCollaborators,
    };
  }
}

export const nodeService = new NodeService();
