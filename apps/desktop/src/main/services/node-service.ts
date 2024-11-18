import {
  Node,
  NodeAttributes,
  NodeMutationContext,
  registry,
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalUpdateNodeChangeData,
  ServerNodeState,
  ServerUserNodeState,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import { generateId, IdType } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { fetchNodeAncestors, mapNode } from '@/main/utils';
import { CreateDownload, CreateUpload } from '@/main/data/workspace/schema';
import { eventBus } from '@/shared/lib/event-bus';
import { Download } from '@/shared/types/nodes';
import { Upload } from '@/shared/types/nodes';
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
    const createdNodes: Node[] = [];
    const createdUploads: Upload[] = [];
    const createdDownloads: Download[] = [];
    const createdChangeIds: number[] = [];

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const inputItem of inputs) {
        const model = registry.getModel(inputItem.attributes.type);
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

        const ydoc = new YDoc(inputItem.id);
        ydoc.updateAttributes(inputItem.attributes);

        const createdAt = new Date().toISOString();
        const versionId = generateId(IdType.Version);

        const changeData: LocalCreateNodeChangeData = {
          type: 'node_create',
          id: inputItem.id,
          state: ydoc.getEncodedState(),
          createdAt: createdAt,
          createdBy: context.userId,
          versionId: versionId,
        };

        const createdNodeRow = await transaction
          .insertInto('nodes')
          .returningAll()
          .values({
            id: inputItem.id,
            attributes: JSON.stringify(inputItem.attributes),
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

        const createdChange = await transaction
          .insertInto('changes')
          .returning('id')
          .values({
            data: JSON.stringify(changeData),
            created_at: createdAt,
            retry_count: 0,
          })
          .executeTakeFirst();

        if (createdChange) {
          createdChangeIds.push(createdChange.id);
        }

        if (inputItem.upload) {
          const createdUploadRow = await transaction
            .insertInto('uploads')
            .returningAll()
            .values(inputItem.upload)
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

        if (inputItem.download) {
          const createdDownloadRow = await transaction
            .insertInto('downloads')
            .returningAll()
            .values(inputItem.download)
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

    for (const createdChangeId of createdChangeIds) {
      eventBus.publish({
        type: 'change_created',
        userId,
        changeId: createdChangeId,
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

    let changeId: number | undefined;
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

          const createdChange = await trx
            .insertInto('changes')
            .returning('id')
            .values({
              data: JSON.stringify(changeData),
              created_at: updatedAt,
              retry_count: 0,
            })
            .executeTakeFirst();

          if (createdChange) {
            changeId = createdChange.id;
          }
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

    if (changeId) {
      eventBus.publish({
        type: 'change_created',
        userId,
        changeId,
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

    let changeId: number | undefined;
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

      const createdChange = await trx
        .insertInto('changes')
        .returning('id')
        .values({
          data: JSON.stringify(changeData),
          created_at: new Date().toISOString(),
          retry_count: 0,
        })
        .executeTakeFirst();

      if (createdChange) {
        changeId = createdChange.id;
      }
    });

    eventBus.publish({
      type: 'node_deleted',
      userId,
      node: node,
    });

    if (changeId) {
      eventBus.publish({
        type: 'change_created',
        userId,
        changeId,
      });
    }
  }

  public async serverSync(
    userId: string,
    node: ServerNodeState
  ): Promise<boolean> {
    let count = 0;
    while (count++ < 20) {
      const synced = await this.tryServerSync(userId, node);
      if (synced) {
        return true;
      }
    }

    return false;
  }

  private async tryServerSync(userId: string, node: ServerNodeState) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingNode = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', node.id)
      .selectAll()
      .executeTakeFirst();

    if (!existingNode) {
      const ydoc = new YDoc(node.id, node.state);
      const attributes = ydoc.getAttributes();
      const state = ydoc.getState();

      const result = await workspaceDatabase
        .insertInto('nodes')
        .returningAll()
        .values({
          id: node.id,
          attributes: JSON.stringify(attributes),
          state: state,
          created_at: node.createdAt,
          created_by: node.createdBy,
          version_id: node.versionId,
          server_created_at: node.serverCreatedAt,
          server_version_id: node.versionId,
        })
        .onConflict((cb) => cb.doNothing())
        .executeTakeFirst();

      if (result) {
        eventBus.publish({
          type: 'node_created',
          userId: userId,
          node: mapNode(result),
        });

        return true;
      }
    } else {
      const ydoc = new YDoc(node.id, existingNode.state);
      ydoc.applyUpdate(node.state);

      const attributes = ydoc.getAttributes();
      const state = ydoc.getState();

      const updatedNode = await workspaceDatabase
        .updateTable('nodes')
        .returningAll()
        .set({
          state: state,
          attributes: JSON.stringify(attributes),
          server_created_at: node.serverCreatedAt,
          server_updated_at: node.serverUpdatedAt,
          server_version_id: node.versionId,
          updated_at: node.updatedAt,
          updated_by: node.updatedBy,
          version_id: node.versionId,
        })
        .where('id', '=', node.id)
        .where('version_id', '=', existingNode.version_id)
        .executeTakeFirst();

      if (updatedNode) {
        eventBus.publish({
          type: 'node_updated',
          userId: userId,
          node: mapNode(updatedNode),
        });

        return true;
      }
    }

    return false;
  }

  public async serverDelete(userId: string, nodeId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedNode = await workspaceDatabase
      .deleteFrom('nodes')
      .returningAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (deletedNode) {
      eventBus.publish({
        type: 'node_deleted',
        userId,
        node: mapNode(deletedNode),
      });
    }

    return false;
  }

  public async serverUserNodeSync(
    userId: string,
    userNode: ServerUserNodeState
  ): Promise<boolean> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const createdUserNode = await workspaceDatabase
      .insertInto('user_nodes')
      .returningAll()
      .values({
        user_id: userNode.userId,
        node_id: userNode.nodeId,
        version_id: userNode.versionId,
        last_seen_at: userNode.lastSeenAt,
        last_seen_version_id: userNode.lastSeenVersionId,
        mentions_count: userNode.mentionsCount,
        created_at: userNode.createdAt,
        updated_at: userNode.updatedAt,
      })
      .onConflict((cb) =>
        cb.columns(['node_id', 'user_id']).doUpdateSet({
          last_seen_at: userNode.lastSeenAt,
          last_seen_version_id: userNode.lastSeenVersionId,
          mentions_count: userNode.mentionsCount,
          updated_at: userNode.updatedAt,
          version_id: userNode.versionId,
        })
      )
      .executeTakeFirst();

    if (createdUserNode) {
      eventBus.publish({
        type: 'user_node_created',
        userId: userId,
        userNode: {
          userId: createdUserNode.user_id,
          nodeId: createdUserNode.node_id,
          lastSeenAt: createdUserNode.last_seen_at,
          lastSeenVersionId: createdUserNode.last_seen_version_id,
          mentionsCount: createdUserNode.mentions_count,
          attributes: createdUserNode.attributes,
          versionId: createdUserNode.version_id,
          createdAt: createdUserNode.created_at,
          updatedAt: createdUserNode.updated_at,
        },
      });

      return true;
    }

    return false;
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
