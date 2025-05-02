import { createDebugger } from '@colanode/core';

import { database } from '@/data/database';
import { JobHandler } from '@/types/jobs';
import { eventBus } from '@/lib/event-bus';
import { CreateNodeTombstone } from '@/data/schema';
import { deleteFile } from '@/lib/files';

const BATCH_SIZE = 100;
const debug = createDebugger('server:job:clean-node-data');

export type CleanNodeDataInput = {
  type: 'clean_node_data';
  nodeId: string;
  workspaceId: string;
  userId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    clean_node_data: {
      input: CleanNodeDataInput;
    };
  }
}

export const cleanNodeDataHandler: JobHandler<CleanNodeDataInput> = async (
  input
) => {
  debug(`Cleaning node data for ${input.nodeId}`);

  await cleanNodeRelations([input.nodeId]);
  await cleanNodeFiles([input.nodeId]);

  let hasMore = true;
  while (hasMore) {
    const children = await database
      .selectFrom('nodes')
      .select(['id', 'root_id', 'workspace_id'])
      .where('parent_id', '=', input.nodeId)
      .limit(BATCH_SIZE)
      .execute();

    if (children.length === 0) {
      hasMore = false;
      break;
    }

    for (const child of children) {
      await cleanDescendants(child.id, input.userId);
    }
  }
};

const cleanDescendants = async (nodeId: string, userId: string) => {
  let hasMore = true;
  while (hasMore) {
    const descendants = await database
      .selectFrom('node_paths')
      .select('descendant_id')
      .where('ancestor_id', '=', nodeId)
      .orderBy('level', 'desc')
      .limit(BATCH_SIZE)
      .execute();

    if (descendants.length === 0) {
      hasMore = false;
      break;
    }

    const nodeIds = descendants.map((d) => d.descendant_id);
    const nodes = await database
      .selectFrom('nodes')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', 'in', nodeIds)
      .execute();

    const nodeTombstonesToCreate: CreateNodeTombstone[] = nodes.map((node) => ({
      id: node.id,
      root_id: node.root_id,
      workspace_id: node.workspace_id,
      deleted_at: new Date(),
      deleted_by: userId,
    }));

    await cleanNodeRelations(nodeIds);
    await cleanNodeFiles(nodeIds);

    await database.transaction().execute(async (trx) => {
      await trx
        .insertInto('node_tombstones')
        .values(nodeTombstonesToCreate)
        .onConflict((b) => b.columns(['id']).doNothing())
        .execute();

      await trx.deleteFrom('nodes').where('id', 'in', nodeIds).execute();
    });

    for (const node of nodes) {
      eventBus.publish({
        type: 'node_deleted',
        nodeId: node.id,
        rootId: node.root_id,
        workspaceId: node.workspace_id,
      });
    }
  }
};

const cleanNodeRelations = async (nodeIds: string[]) => {
  await database
    .deleteFrom('node_updates')
    .where('node_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('node_reactions')
    .where('node_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('node_interactions')
    .where('node_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('node_embeddings')
    .where('node_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('collaborations')
    .where('node_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('document_embeddings')
    .where('document_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('document_updates')
    .where('document_id', 'in', nodeIds)
    .execute();

  await database
    .deleteFrom('document_embeddings')
    .where('document_id', 'in', nodeIds)
    .execute();
};

const cleanNodeFiles = async (nodeIds: string[]) => {
  const uploads = await database
    .selectFrom('uploads')
    .selectAll()
    .where('file_id', 'in', nodeIds)
    .execute();

  if (uploads.length > 0) {
    for (const upload of uploads) {
      await deleteFile(upload.path);
    }

    await database
      .deleteFrom('uploads')
      .where('file_id', 'in', nodeIds)
      .execute();
  }
};
