import {
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import {
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalUpdateNodeChangeData,
} from '@/shared/types/sync';
import { generateId, IdType } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { fetchNodeAncestors, mapNode } from '@/main/utils';
import { CreateDownload, CreateUpload } from '@/main/data/workspace/schema';
import { eventBus } from '@/shared/lib/event-bus';
import { Download } from '@/shared/types/nodes';
import { Upload } from '@/shared/types/nodes';

export type CreateNodeInput = {
  id: string;
  attributes: NodeAttributes;
  upload?: CreateUpload;
  download?: CreateDownload;
};

class NodeService {
  async createNode(userId: string, input: CreateNodeInput | CreateNodeInput[]) {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const inputs = Array.isArray(input) ? input : [input];
    const createdNodes: Node[] = [];
    const createdUploads: Upload[] = [];
    const createdDownloads: Download[] = [];

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const input of inputs) {
        const model = registry.getModel(input.attributes.type);
        if (!model.schema.safeParse(input.attributes).success) {
          throw new Error('Invalid attributes');
        }

        let ancestors: Node[] = [];
        if (input.attributes.parentId) {
          const ancestorRows = await fetchNodeAncestors(
            transaction,
            input.attributes.parentId
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

        if (!model.canCreate(context, input.attributes)) {
          throw new Error('Insufficient permissions');
        }

        const ydoc = new YDoc(input.id);
        ydoc.updateAttributes(input.attributes);

        const createdAt = new Date().toISOString();
        const versionId = generateId(IdType.Version);

        const changeData: LocalCreateNodeChangeData = {
          type: 'node_create',
          id: input.id,
          state: ydoc.getEncodedState(),
          createdAt: createdAt,
          createdBy: context.userId,
          versionId: versionId,
        };

        const createdNodeRow = await transaction
          .insertInto('nodes')
          .returningAll()
          .values({
            id: input.id,
            attributes: JSON.stringify(input.attributes),
            state: ydoc.getState(),
            created_at: createdAt,
            created_by: context.userId,
            version_id: versionId,
          })
          .executeTakeFirst();

        if (createdNodeRow) {
          const createdNode = mapNode(createdNodeRow);
          createdNodes.push(createdNode);
        }

        await transaction
          .insertInto('changes')
          .values({
            data: JSON.stringify(changeData),
            created_at: createdAt,
            retry_count: 0,
          })
          .execute();

        if (input.upload) {
          const createdUploadRow = await transaction
            .insertInto('uploads')
            .returningAll()
            .values(input.upload)
            .executeTakeFirst();

          if (createdUploadRow) {
            createdUploads.push({
              nodeId: createdUploadRow.node_id,
              createdAt: createdUploadRow.created_at,
              updatedAt: createdUploadRow.updated_at,
              progress: createdUploadRow.progress,
              retryCount: createdUploadRow.retry_count,
            });
          }
        }

        if (input.download) {
          const createdDownloadRow = await transaction
            .insertInto('downloads')
            .returningAll()
            .values(input.download)
            .executeTakeFirst();

          if (createdDownloadRow) {
            createdDownloads.push({
              nodeId: createdDownloadRow.node_id,
              createdAt: createdDownloadRow.created_at,
              updatedAt: createdDownloadRow.updated_at,
              progress: createdDownloadRow.progress,
              retryCount: createdDownloadRow.retry_count,
            });
          }
        }
      }
    });

    for (const createdNode of createdNodes) {
      eventBus.publish({
        type: 'node_created',
        userId,
        node: createdNode,
      });
    }

    for (const createdUpload of createdUploads) {
      eventBus.publish({
        type: 'upload_created',
        userId,
        upload: createdUpload,
      });
    }

    for (const createdDownload of createdDownloads) {
      eventBus.publish({
        type: 'download_created',
        userId,
        download: createdDownload,
      });
    }
  }

  async updateNode(
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
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

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

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(node.attributes);

    const model = registry.getModel(node.type);
    if (!model.schema.safeParse(updatedAttributes).success) {
      throw new Error('Invalid attributes');
    }

    if (!model.canUpdate(context, node, updatedAttributes)) {
      throw new Error('Insufficient permissions');
    }

    const ydoc = new YDoc(nodeRow.id, nodeRow.state);
    ydoc.updateAttributes(updatedAttributes);

    const updates = ydoc.getEncodedUpdates();
    if (updates.length === 0) {
      return true;
    }

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: nodeId,
      updatedAt: updatedAt,
      updatedBy: context.userId,
      versionId: versionId,
      updates: updates,
    };

    const result = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedRow = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            state: ydoc.getState(),
            updated_at: updatedAt,
            updated_by: context.userId,
            version_id: versionId,
          })
          .where('id', '=', nodeId)
          .where('version_id', '=', node.versionId)
          .executeTakeFirst();

        if (updatedRow) {
          node = mapNode(updatedRow);

          await trx
            .insertInto('changes')
            .values({
              data: JSON.stringify(changeData),
              created_at: updatedAt,
              retry_count: 0,
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

  async deleteNode(nodeId: string, userId: string) {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchNodeAncestors(workspaceDatabase, nodeId);
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === nodeId);

    if (!node) {
      throw new Error('Node not found');
    }

    const model = registry.getModel(node.type);
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

    const changeData: LocalDeleteNodeChangeData = {
      type: 'node_delete',
      id: nodeId,
      deletedAt: new Date().toISOString(),
      deletedBy: context.userId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('user_nodes')
        .where('node_id', '=', nodeId)
        .execute();
      await trx.deleteFrom('nodes').where('id', '=', nodeId).execute();
      await trx.deleteFrom('uploads').where('node_id', '=', nodeId).execute();
      await trx.deleteFrom('downloads').where('node_id', '=', nodeId).execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: new Date().toISOString(),
          retry_count: 0,
        })
        .execute();
    });

    eventBus.publish({
      type: 'node_deleted',
      userId,
      node: node,
    });
  }
}

export const nodeService = new NodeService();