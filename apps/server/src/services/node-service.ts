import {
  extractNodeCollaborators,
  generateId,
  IdType,
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import {
  CreateCollaboration,
  CreateNode,
  CreateNodeTransaction,
  SelectCollaboration,
  SelectWorkspaceUser,
} from '@/data/schema';
import { cloneDeep, difference } from 'lodash-es';
import { fetchWorkspaceUsers, mapNode } from '@/lib/nodes';
import { database } from '@/data/database';
import { fetchNodeAncestors } from '@/lib/nodes';
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
import { buildDefaultCollaboration } from '@/lib/collaborations';
import { eventBus } from '@/lib/event-bus';
import { logService } from '@/services/log';
import { jobService } from '@/services/job-service';

const UPDATE_RETRIES_LIMIT = 10;

type UpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};

type CollaboratorChangeResult = {
  removedCollaborators: string[];
  addedCollaborators: string[];
};

class NodeService {
  private readonly logger = logService.createLogger('node-service');

  public async createNode(
    input: CreateNodeInput
  ): Promise<CreateNodeOutput | null> {
    const model = registry.getNodeModel(input.attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(model.schema, input.attributes);
    const attributesJson = JSON.stringify(ydoc.getAttributes<NodeAttributes>());

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
      workspace_id: input.workspaceId,
      type: 'create',
      data: update,
      created_at: date,
      created_by: input.userId,
      server_created_at: date,
    };

    const createCollaborations = await this.buildCollaborations(
      input.nodeId,
      input.workspaceId,
      input.attributes,
      input.ancestors
    );

    try {
      const { createdNode, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          createNode,
          createTransaction,
          createCollaborations
        );

      eventBus.publish({
        type: 'node_transaction_created',
        transactionId: transactionId,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });

      for (const collaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          userId: collaboration.user_id,
          nodeId: collaboration.node_id,
          workspaceId: collaboration.workspace_id,
        });
      }

      return {
        node: createdNode,
        transaction: createdTransaction,
        createdCollaborations: createdCollaborations,
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

    const { addedCollaborators, removedCollaborators } =
      this.checkCollaboratorChanges(
        node,
        ancestors.filter((a) => a.id !== input.nodeId),
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
              workspace_id: input.workspaceId,
              type: 'update',
              data: update,
              created_at: date,
              created_by: input.userId,
              server_created_at: date,
            })
            .executeTakeFirst();

          if (!createdTransaction) {
            throw new Error('Failed to create transaction');
          }

          return {
            updatedNode,
            createdTransaction,
          };
        });

      eventBus.publish({
        type: 'node_transaction_created',
        transactionId: transactionId,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });

      for (const addedCollaborator of addedCollaborators) {
        jobService.addJob({
          type: 'create_collaborations',
          nodeId: input.nodeId,
          userId: addedCollaborator,
          workspaceId: input.workspaceId,
        });
      }

      for (const removedCollaborator of removedCollaborators) {
        jobService.addJob({
          type: 'delete_collaborations',
          nodeId: input.nodeId,
          userId: removedCollaborator,
          workspaceId: input.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch (error) {
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
      workspace_id: context.workspaceId,
      type: 'create',
      data:
        typeof input.data === 'string' ? decodeState(input.data) : input.data,
      created_at: input.createdAt,
      created_by: context.userId,
      server_created_at: new Date(),
    };

    const createCollaborations: CreateCollaboration[] =
      await this.buildCollaborations(
        input.nodeId,
        context.workspaceId,
        attributes,
        ancestors
      );

    try {
      const { createdNode, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          createNode,
          createTransaction,
          createCollaborations
        );

      eventBus.publish({
        type: 'node_transaction_created',
        transactionId: input.id,
        nodeId: input.nodeId,
        workspaceId: context.workspaceId,
      });

      for (const collaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          userId: collaboration.user_id,
          nodeId: collaboration.node_id,
          workspaceId: collaboration.workspace_id,
        });
      }

      return {
        node: createdNode,
        transaction: createdTransaction,
        collaborations: createdCollaborations,
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
      .orderBy('number', 'asc')
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

    const { addedCollaborators, removedCollaborators } =
      this.checkCollaboratorChanges(
        node,
        ancestors.filter((a) => a.id !== input.nodeId),
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
              type: 'update',
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

          return {
            updatedNode,
            createdTransaction,
          };
        });

      eventBus.publish({
        type: 'node_transaction_created',
        transactionId: input.id,
        nodeId: input.nodeId,
        workspaceId: context.workspaceId,
      });

      for (const addedCollaborator of addedCollaborators) {
        jobService.addJob({
          type: 'create_collaborations',
          nodeId: input.nodeId,
          userId: addedCollaborator,
          workspaceId: context.workspaceId,
        });
      }

      for (const removedCollaborator of removedCollaborators) {
        jobService.addJob({
          type: 'delete_collaborations',
          nodeId: input.nodeId,
          userId: removedCollaborator,
          workspaceId: context.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          node: updatedNode,
          transaction: createdTransaction,
        },
      };
    } catch (error) {
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

    const { deletedNode, createdTransaction, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
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
            type: 'delete',
            created_at: input.createdAt,
            created_by: workspaceUser.id,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const updatedCollaborations = await trx
          .updateTable('collaborations')
          .returningAll()
          .set({
            deleted_at: input.createdAt,
          })
          .where('node_id', '=', input.nodeId)
          .execute();

        return {
          deletedNode,
          createdTransaction,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node_transaction_created',
      transactionId: input.id,
      nodeId: input.nodeId,
      workspaceId: workspaceUser.workspace_id,
    });

    for (const collaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        userId: collaboration.user_id,
        nodeId: collaboration.node_id,
        workspaceId: collaboration.workspace_id,
      });
    }

    return {
      node: deletedNode,
      transaction: createdTransaction,
      updatedCollaborations,
    };
  }

  private async applyDatabaseCreateTransaction(
    node: CreateNode,
    transaction: CreateNodeTransaction,
    collaborations: CreateCollaboration[]
  ) {
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

      let createdCollaborations: SelectCollaboration[] = [];
      if (collaborations.length > 0) {
        createdCollaborations = await trx
          .insertInto('collaborations')
          .returningAll()
          .values(collaborations)
          .execute();

        if (createdCollaborations.length !== collaborations.length) {
          throw new Error('Failed to create collaborations');
        }
      }

      return { createdNode, createdTransaction, createdCollaborations };
    });
  }

  private async buildCollaborations(
    nodeId: string,
    workspaceId: string,
    attributes: NodeAttributes,
    ancestors: Node[]
  ) {
    if (attributes.type === 'user') {
      return this.buildUserCollaborations(nodeId, workspaceId);
    }

    return this.buildNodeCollaborations(
      nodeId,
      workspaceId,
      attributes,
      ancestors
    );
  }

  private async buildUserCollaborations(
    userId: string,
    workspaceId: string
  ): Promise<CreateCollaboration[]> {
    const createCollaborations: CreateCollaboration[] = [];
    createCollaborations.push(
      buildDefaultCollaboration(userId, workspaceId, 'workspace', workspaceId)
    );

    const workspaceUserIds = await fetchWorkspaceUsers(workspaceId);

    for (const workspaceUserId of workspaceUserIds) {
      createCollaborations.push(
        buildDefaultCollaboration(workspaceUserId, userId, 'user', workspaceId)
      );

      if (workspaceUserId === userId) {
        continue;
      }

      createCollaborations.push(
        buildDefaultCollaboration(userId, workspaceUserId, 'user', workspaceId)
      );
    }

    return createCollaborations;
  }

  private buildNodeCollaborations(
    nodeId: string,
    workspaceId: string,
    attributes: NodeAttributes,
    ancestors: Node[]
  ): CreateCollaboration[] {
    const collaborators = extractNodeCollaborators([
      ...ancestors.map((a) => a.attributes),
      attributes,
    ]);

    const collaboratorIds = Object.keys(collaborators);
    const createCollaborations: CreateCollaboration[] = collaboratorIds.map(
      (userId) =>
        buildDefaultCollaboration(userId, nodeId, attributes.type, workspaceId)
    );

    return createCollaborations;
  }

  private checkCollaboratorChanges(
    node: Node,
    ancestors: Node[],
    newAttributes: NodeAttributes
  ): CollaboratorChangeResult {
    const beforeCollaborators = Object.keys(
      extractNodeCollaborators(node.attributes)
    );

    const afterCollaborators = Object.keys(
      extractNodeCollaborators(newAttributes)
    );

    if (beforeCollaborators.length === 0 && afterCollaborators.length === 0) {
      return { removedCollaborators: [], addedCollaborators: [] };
    }

    const addedCollaborators = difference(
      afterCollaborators,
      beforeCollaborators
    );

    const removedCollaborators = difference(
      beforeCollaborators,
      afterCollaborators
    );

    if (addedCollaborators.length === 0 && removedCollaborators.length === 0) {
      return { removedCollaborators: [], addedCollaborators: [] };
    }

    const inheritedCollaborators = Object.keys(
      extractNodeCollaborators(ancestors.map((a) => a.attributes))
    );

    const added = difference(addedCollaborators, inheritedCollaborators);
    const removed = difference(removedCollaborators, inheritedCollaborators);

    return { removedCollaborators: removed, addedCollaborators: added };
  }
}

export const nodeService = new NodeService();
