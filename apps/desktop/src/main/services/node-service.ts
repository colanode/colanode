import {
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
  ServerNodeCreateTransaction,
  ServerNodeDeleteTransaction,
  ServerNodeTransaction,
  ServerNodeUpdateTransaction,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { generateId, IdType } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import {
  fetchNodeAncestors,
  mapDownload,
  mapNode,
  mapTransaction,
  mapUpload,
} from '@/main/utils';
import {
  CreateDownload,
  CreateUpload,
  SelectDownload,
  SelectNode,
  SelectNodeTransaction,
  SelectUpload,
} from '@/main/data/workspace/schema';
import { eventBus } from '@/shared/lib/event-bus';
import { SelectWorkspace } from '@/main/data/app/schema';

export type CreateNodeInput = {
  id: string;
  attributes: NodeAttributes;
  upload?: CreateUpload;
  download?: CreateDownload;
};

class NodeService {
  public async fetchNode(nodeId: string, userId: string): Promise<Node | null> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const nodeRow = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', nodeId)
      .selectAll()
      .executeTakeFirst();

    if (!nodeRow) {
      return null;
    }

    return mapNode(nodeRow);
  }

  public async createNode(
    userId: string,
    input: CreateNodeInput | CreateNodeInput[]
  ) {
    const workspace = await this.fetchWorkspace(userId);

    const inputs = Array.isArray(input) ? input : [input];
    const createdNodes: SelectNode[] = [];
    const createdNodeTransactions: SelectNodeTransaction[] = [];
    const createdUploads: SelectUpload[] = [];
    const createdDownloads: SelectDownload[] = [];

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const inputItem of inputs) {
        const model = registry.getNodeModel(inputItem.attributes.type);
        if (!model.schema.safeParse(inputItem.attributes).success) {
          throw new Error('Invalid attributes');
        }

        let ancestors: Node[] = [];
        if (inputItem.attributes.parentId) {
          const ancestorRows = await fetchNodeAncestors(
            transaction,
            inputItem.attributes.parentId
          );
          ancestors = ancestorRows.map(mapNode);
        }

        const context = new NodeMutationContext(
          workspace.account_id,
          workspace.workspace_id,
          userId,
          workspace.role,
          ancestors
        );

        if (!model.canCreate(context, inputItem.attributes)) {
          throw new Error('Insufficient permissions');
        }

        const ydoc = new YDoc();
        const update = ydoc.updateAttributes(
          model.schema,
          inputItem.attributes
        );

        const createdAt = new Date().toISOString();
        const transactionId = generateId(IdType.Transaction);

        const createdNode = await transaction
          .insertInto('nodes')
          .returningAll()
          .values({
            id: inputItem.id,
            attributes: JSON.stringify(inputItem.attributes),
            created_at: createdAt,
            created_by: context.userId,
            transaction_id: transactionId,
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        createdNodes.push(createdNode);

        const createdTransaction = await transaction
          .insertInto('node_transactions')
          .returningAll()
          .values({
            id: transactionId,
            node_id: inputItem.id,
            type: 'create',
            data: update,
            created_at: createdAt,
            created_by: context.userId,
            retry_count: 0,
            status: 'pending',
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        createdNodeTransactions.push(createdTransaction);

        if (inputItem.upload) {
          const createdUpload = await transaction
            .insertInto('uploads')
            .returningAll()
            .values(inputItem.upload)
            .executeTakeFirst();

          if (!createdUpload) {
            throw new Error('Failed to create upload');
          }

          createdUploads.push(createdUpload);
        }

        if (inputItem.download) {
          const createdDownload = await transaction
            .insertInto('downloads')
            .returningAll()
            .values(inputItem.download)
            .executeTakeFirst();

          if (!createdDownload) {
            throw new Error('Failed to create download');
          }

          createdDownloads.push(createdDownload);
        }
      }
    });

    for (const createdNode of createdNodes) {
      eventBus.publish({
        type: 'node_created',
        userId,
        node: mapNode(createdNode),
      });
    }

    for (const createdTransaction of createdNodeTransactions) {
      eventBus.publish({
        type: 'node_transaction_created',
        userId,
        transaction: mapTransaction(createdTransaction),
      });
    }

    for (const createdUpload of createdUploads) {
      eventBus.publish({
        type: 'upload_created',
        userId,
        upload: mapUpload(createdUpload),
      });
    }

    for (const createdDownload of createdDownloads) {
      eventBus.publish({
        type: 'download_created',
        userId,
        download: mapDownload(createdDownload),
      });
    }
  }

  public async updateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ) {
    let count = 0;
    while (count++ < 20) {
      const updated = await this.tryUpdateNode(nodeId, userId, updater);
      if (updated) {
        return;
      }
    }

    throw new Error('Failed to update node');
  }

  private async tryUpdateNode(
    nodeId: string,
    userId: string,
    updater: (attributes: NodeAttributes) => NodeAttributes
  ): Promise<boolean> {
    const workspace = await this.fetchWorkspace(userId);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchNodeAncestors(workspaceDatabase, nodeId);
    const nodeRow = ancestorRows.find((ancestor) => ancestor.id === nodeId);
    if (!nodeRow) {
      throw new Error('Node not found');
    }

    const ancestors = ancestorRows.map(mapNode);
    let node = mapNode(nodeRow);

    if (!node) {
      throw new Error('Node not found');
    }

    const context = new NodeMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    const transactionId = generateId(IdType.Transaction);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes);

    const model = registry.getNodeModel(node.type);
    if (!model.schema.safeParse(updatedAttributes).success) {
      throw new Error('Invalid attributes');
    }

    if (!model.canUpdate(context, node, updatedAttributes)) {
      throw new Error('Insufficient permissions');
    }

    const ydoc = new YDoc();
    const previousTransactions = await workspaceDatabase
      .selectFrom('node_transactions')
      .where('node_id', '=', nodeId)
      .selectAll()
      .execute();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        throw new Error('Node has been deleted');
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    const update = ydoc.updateAttributes(model.schema, updatedAttributes);

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedRow = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: updatedAt,
            updated_by: context.userId,
            transaction_id: transactionId,
          })
          .where('id', '=', nodeId)
          .where('transaction_id', '=', node.transactionId)
          .executeTakeFirst();

        if (updatedRow) {
          node = mapNode(updatedRow);

          await trx
            .insertInto('node_transactions')
            .values({
              id: transactionId,
              node_id: nodeId,
              type: 'update',
              data: update,
              created_at: updatedAt,
              created_by: context.userId,
              retry_count: 0,
              status: 'pending',
            })
            .execute();
        }

        return true;
      });

    if (result) {
      eventBus.publish({
        type: 'node_updated',
        userId,
        node,
      });
    }

    return result;
  }

  public async deleteNode(nodeId: string, userId: string) {
    const workspace = await this.fetchWorkspace(userId);
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchNodeAncestors(workspaceDatabase, nodeId);
    const ancestors = ancestorRows.map(mapNode);

    const node = ancestors.find((ancestor) => ancestor.id === nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    const model = registry.getNodeModel(node.type);
    const context = new NodeMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    if (!model.canDelete(context, node)) {
      throw new Error('Insufficient permissions');
    }

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx.deleteFrom('nodes').where('id', '=', nodeId).execute();
      await trx
        .deleteFrom('node_transactions')
        .where('node_id', '=', nodeId)
        .execute();

      await trx
        .insertInto('node_transactions')
        .values({
          id: generateId(IdType.Transaction),
          node_id: nodeId,
          type: 'delete',
          data: null,
          created_at: new Date().toISOString(),
          created_by: context.userId,
          retry_count: 0,
          status: 'pending',
        })
        .executeTakeFirst();
    });

    eventBus.publish({
      type: 'node_deleted',
      userId,
      node: node,
    });
  }

  public async applyServerTransaction(
    userId: string,
    transaction: ServerNodeTransaction
  ) {
    if (transaction.type === 'create') {
      await this.applyServerCreateTransaction(userId, transaction);
    } else if (transaction.type === 'update') {
      await this.applyServerUpdateTransaction(userId, transaction);
    } else if (transaction.type === 'delete') {
      await this.applyServerDeleteTransaction(userId, transaction);
    }
  }

  private async applyServerCreateTransaction(
    userId: string,
    transaction: ServerNodeCreateTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const number = BigInt(transaction.number);
    const existingTransaction = await workspaceDatabase
      .selectFrom('node_transactions')
      .select(['id', 'status', 'number', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.status === 'synced' &&
        existingTransaction.number === number &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        return;
      }

      await workspaceDatabase
        .updateTable('node_transactions')
        .set({
          status: 'synced',
          number,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      return;
    }

    const ydoc = new YDoc();
    ydoc.applyUpdate(transaction.data);

    const attributes = ydoc.getAttributes();

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        await trx
          .insertInto('node_transactions')
          .values({
            id: transaction.id,
            node_id: transaction.nodeId,
            type: 'create',
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            retry_count: 0,
            status: 'synced',
            number,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        const nodeRow = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: transaction.nodeId,
            attributes: JSON.stringify(attributes),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .executeTakeFirst();

        return nodeRow;
      });

    if (result) {
      eventBus.publish({
        type: 'node_created',
        userId,
        node: mapNode(result),
      });
    }
  }

  private async applyServerUpdateTransaction(
    userId: string,
    transaction: ServerNodeUpdateTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const number = BigInt(transaction.number);
    const existingTransaction = await workspaceDatabase
      .selectFrom('node_transactions')
      .select(['id', 'status', 'number', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.status === 'synced' &&
        existingTransaction.number === number &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        return;
      }

      await workspaceDatabase
        .updateTable('node_transactions')
        .set({
          status: 'synced',
          number,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      return;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('node_transactions')
      .selectAll()
      .where('node_id', '=', transaction.nodeId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }
    }

    ydoc.applyUpdate(transaction.data);
    const attributes = ydoc.getAttributes();

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        await trx
          .insertInto('node_transactions')
          .values({
            id: transaction.id,
            node_id: transaction.nodeId,
            type: 'update',
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            retry_count: 0,
            status: 'synced',
            number,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        const nodeRow = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: transaction.createdAt,
            updated_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .where('id', '=', transaction.nodeId)
          .executeTakeFirst();

        return nodeRow;
      });

    if (result) {
      eventBus.publish({
        type: 'node_updated',
        userId,
        node: mapNode(result),
      });
    }
  }

  private async applyServerDeleteTransaction(
    userId: string,
    transaction: ServerNodeDeleteTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        await trx
          .deleteFrom('node_transactions')
          .where('node_id', '=', transaction.nodeId)
          .execute();

        const nodeRow = await trx
          .deleteFrom('nodes')
          .returningAll()
          .where('id', '=', transaction.nodeId)
          .executeTakeFirst();

        return nodeRow;
      });

    if (result) {
      eventBus.publish({
        type: 'node_deleted',
        userId,
        node: mapNode(result),
      });
    }
  }

  async fetchWorkspace(userId: string): Promise<SelectWorkspace> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }
}

export const nodeService = new NodeService();
