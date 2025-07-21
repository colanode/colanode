import { UpdateMergeMetadata } from '@colanode/core';
import { mergeUpdates } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import { SelectDocumentUpdate } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import { config } from '@colanode/server/lib/config';
import { fetchCounter, setCounter } from '@colanode/server/lib/counters';
import { createLogger } from '@colanode/server/lib/logger';

const logger = createLogger('server:job:document-updates-merge');

export type DocumentUpdatesMergeInput = {
  type: 'document.updates.merge';
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'document.updates.merge': {
      input: DocumentUpdatesMergeInput;
    };
  }
}

export const documentUpdatesMergeHandler: JobHandler<
  DocumentUpdatesMergeInput
> = async () => {
  if (!config.jobs.documentUpdatesMerge.enabled) {
    return;
  }

  logger.debug('Starting document updates merge job');

  const cursor = await fetchCounter(database, 'document.updates.merge.cursor');

  const cutoffTime = new Date();
  cutoffTime.setTime(
    cutoffTime.getTime() - config.jobs.documentUpdatesMerge.cutoffWindow * 1000
  );

  let mergedGroups = 0;
  let deletedUpdates = 0;
  let hasMore = true;
  let currentCursor = cursor;

  while (hasMore) {
    const updates = await database
      .selectFrom('document_updates')
      .selectAll()
      .where('revision', '>', currentCursor.toString())
      .where('created_at', '<', cutoffTime)
      .orderBy('revision', 'asc')
      .limit(config.jobs.documentUpdatesMerge.batchSize)
      .execute();

    if (updates.length === 0) {
      hasMore = false;
      continue;
    }

    logger.debug(`Processing batch of ${updates.length} updates`);

    const documentsMap = new Map<string, SelectDocumentUpdate[]>();
    for (const update of updates) {
      const documentUpdates = documentsMap.get(update.document_id) ?? [];
      documentUpdates.push(update);
      documentsMap.set(update.document_id, documentUpdates);
    }

    const maxRevision = updates.reduce((max, update) => {
      const rev = BigInt(update.revision);
      return rev > max ? rev : max;
    }, BigInt(0));

    for (const [documentId, documentUpdates] of documentsMap.entries()) {
      const result = await processDocumentUpdates(
        documentId,
        documentUpdates,
        config.jobs.documentUpdatesMerge.mergeWindow
      );
      mergedGroups += result.mergedGroups;
      deletedUpdates += result.deletedUpdates;
    }

    await setCounter(database, 'document.updates.merge.cursor', maxRevision);
    currentCursor = maxRevision;

    if (updates.length < config.jobs.documentUpdatesMerge.batchSize) {
      hasMore = false;
    }
  }

  logger.debug(
    `Document updates merge job completed. Merged ${mergedGroups} groups, deleted ${deletedUpdates} redundant updates`
  );
};

const processDocumentUpdates = async (
  documentId: string,
  documentUpdates: SelectDocumentUpdate[],
  mergeWindow: number
): Promise<{ mergedGroups: number; deletedUpdates: number }> => {
  const firstUpdate = documentUpdates[0]!;
  const cutoffTime = new Date(
    firstUpdate.created_at.getTime() - 60 * 60 * 1000
  );

  const previousUpdate = await database
    .selectFrom('document_updates')
    .selectAll()
    .where('document_id', '=', documentId)
    .where('revision', '<', firstUpdate.revision)
    .where('created_at', '>=', cutoffTime)
    .executeTakeFirst();

  const allUpdates = [...documentUpdates];
  if (previousUpdate) {
    allUpdates.unshift(previousUpdate);
  }

  if (allUpdates.length < 2) {
    return { mergedGroups: 0, deletedUpdates: 0 };
  }

  const orderedUpdates = allUpdates.sort((a, b) => {
    const revA = BigInt(a.revision);
    const revB = BigInt(b.revision);
    if (revA > revB) {
      return 1;
    } else if (revA < revB) {
      return -1;
    }
    return 0;
  });

  const groups = groupUpdatesByMergeWindow(orderedUpdates, mergeWindow);

  let mergedGroups = 0;
  let deletedUpdates = 0;

  for (const group of groups) {
    if (group.length < 2) {
      continue;
    }

    const success = await mergeUpdatesGroup(documentId, group);
    if (success) {
      mergedGroups++;
      deletedUpdates += group.length - 1;
    }
  }

  return { mergedGroups, deletedUpdates };
};

const groupUpdatesByMergeWindow = (
  updates: SelectDocumentUpdate[],
  mergeWindow: number
): SelectDocumentUpdate[][] => {
  if (updates.length === 0) return [];

  const timeGroups: SelectDocumentUpdate[][] = [];
  let currentGroup: SelectDocumentUpdate[] = [updates[0]!];

  for (let i = 1; i < updates.length; i++) {
    const currentUpdate = updates[i]!;
    const lastUpdateInGroup = currentGroup[currentGroup.length - 1]!;

    const timeDiff =
      currentUpdate.created_at.getTime() -
      lastUpdateInGroup.created_at.getTime();
    const timeDiffSeconds = Math.abs(timeDiff / 1000);

    if (timeDiffSeconds <= mergeWindow) {
      currentGroup.push(currentUpdate);
    } else {
      timeGroups.push(currentGroup);
      currentGroup = [currentUpdate];
    }
  }

  timeGroups.push(currentGroup);

  return timeGroups;
};

const mergeUpdatesGroup = async (
  documentId: string,
  updates: SelectDocumentUpdate[]
): Promise<boolean> => {
  if (updates.length < 2) {
    return false;
  }

  try {
    const updateData = updates.map((update) => update.data);
    const mergedState = mergeUpdates(updateData);

    const lastUpdate = updates[updates.length - 1]!;
    const updatesToMerge = updates.filter(
      (update) => update.id !== lastUpdate.id
    );

    const updatesToMergeIds = updatesToMerge.map((update) => update.id);
    const mergedUpdatesMetadata: UpdateMergeMetadata[] = [];
    for (const update of updatesToMerge) {
      if (update.merged_updates) {
        for (const mergedUpdate of update.merged_updates) {
          mergedUpdatesMetadata.push({
            id: mergedUpdate.id,
            createdAt: mergedUpdate.createdAt,
            createdBy: mergedUpdate.createdBy,
          });
        }
      }

      mergedUpdatesMetadata.push({
        id: update.id,
        createdAt: update.created_at.toISOString(),
        createdBy: update.created_by,
      });
    }

    await database.transaction().execute(async (trx) => {
      await trx
        .updateTable('document_updates')
        .set({
          data: mergedState,
          merged_updates: JSON.stringify([
            ...(lastUpdate.merged_updates ?? []),
            ...mergedUpdatesMetadata,
          ]),
        })
        .where('id', '=', lastUpdate.id)
        .execute();

      await trx
        .deleteFrom('document_updates')
        .where('id', 'in', updatesToMergeIds)
        .execute();
    });

    return true;
  } catch (error) {
    logger.error(error, `Failed to merge updates for document ${documentId}`);
    return false;
  }
};
