import { generateId, IdType } from '@colanode/core';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { database } from '@/data/database';
import { CreateNodeTransaction, SelectUpload } from '@/data/schema';
import { JobHandler } from '@/types/jobs';
import { filesStorage, BUCKET_NAMES } from '@/data/storage';
import { eventBus } from '@/lib/event-bus';
import { createLogger } from '@/lib/logger';

const BATCH_SIZE = 100;

const logger = createLogger('clean-node-data');

export type CleanNodeDataInput = {
  type: 'clean_node_data';
  nodeId: string;
  workspaceId: string;
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
  logger.trace(`Cleaning node data for ${input.nodeId}`);

  const deleteTransactions = await database
    .selectFrom('node_transactions')
    .selectAll()
    .where('node_id', '=', input.nodeId)
    .execute();

  if (deleteTransactions.length !== 1) {
    logger.error(`Expected 1 delete transaction for ${input.nodeId}`);
    return;
  }

  const deleteTransaction = deleteTransactions[0];
  if (
    !deleteTransaction?.operation ||
    deleteTransaction.operation !== 'delete'
  ) {
    logger.error(`Expected delete transaction for ${input.nodeId}`);
    return;
  }

  const parentIds = [input.nodeId];
  while (parentIds.length > 0) {
    const tempParentIds = parentIds.splice(0, BATCH_SIZE);
    const deletedNodeIds = await deleteChildren(
      tempParentIds,
      input.workspaceId,
      deleteTransaction.created_by
    );

    parentIds.push(...deletedNodeIds);
  }
};

const deleteChildren = async (
  parentIds: string[],
  workspaceId: string,
  userId: string
) => {
  const deletedNodeIds: string[] = [];
  let hasMore = true;
  while (hasMore) {
    try {
      const descendants = await database
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', 'in', parentIds)
        .orderBy('id', 'asc')
        .limit(BATCH_SIZE)
        .execute();

      if (descendants.length === 0) {
        logger.trace(`No descendants found for ${parentIds}`);
        hasMore = false;
        break;
      }

      const fileIds: string[] = descendants
        .filter((d) => d.type === 'file')
        .map((d) => d.id);

      const uploads: SelectUpload[] =
        fileIds.length > 0
          ? await database
              .selectFrom('uploads')
              .selectAll()
              .where('node_id', 'in', fileIds)
              .execute()
          : [];

      const nodeIds: string[] = descendants.map((d) => d.id);
      const transactionsToCreate: CreateNodeTransaction[] = descendants.map(
        (descendant) => ({
          id: generateId(IdType.Transaction),
          node_id: descendant.id,
          node_type: descendant.type,
          workspace_id: workspaceId,
          operation: 'delete',
          created_at: new Date(),
          created_by: userId,
          server_created_at: new Date(),
        })
      );
      const uploadsToDelete: string[] = uploads.map((u) => u.node_id);

      await database.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('node_transactions')
          .where('node_id', 'in', nodeIds)
          .execute();

        const createdTransactions = await trx
          .insertInto('node_transactions')
          .returningAll()
          .values(transactionsToCreate)
          .execute();

        if (createdTransactions.length !== transactionsToCreate.length) {
          throw new Error('Failed to create transactions');
        }

        if (uploadsToDelete.length > 0) {
          await trx
            .deleteFrom('uploads')
            .where('node_id', 'in', uploadsToDelete)
            .execute();
        }

        await trx.deleteFrom('nodes').where('id', 'in', nodeIds).execute();
        await trx
          .updateTable('collaborations')
          .set({
            roles: '{}',
            updated_at: new Date(),
          })
          .where('node_id', 'in', nodeIds)
          .execute();
      });

      for (const upload of uploads) {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAMES.FILES,
          Key: upload.path,
        });

        logger.trace(
          `Deleting file as a descendant of ${parentIds}: ${upload.path}`
        );

        await filesStorage.send(command);
      }

      for (const node of descendants) {
        logger.trace(`Publishing node deleted event for ${node.id}`);

        eventBus.publish({
          type: 'node_deleted',
          nodeId: node.id,
          nodeType: node.type,
          workspaceId: workspaceId,
        });

        deletedNodeIds.push(node.id);
      }

      hasMore = descendants.length === BATCH_SIZE;
    } catch (error) {
      logger.error(`Error cleaning node data for ${parentIds}: ${error}`);
      hasMore = false;
    }
  }

  return deletedNodeIds;
};
