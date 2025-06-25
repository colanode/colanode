import { createDebugger, UpdateMergeMetadata } from '@colanode/core';
import { mergeUpdates } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import { SelectDocumentUpdate } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import { config } from '@colanode/server/lib/config';
import { fetchCounter, setCounter } from '@colanode/server/lib/counters';

const debug = createDebugger('server:job:document-updates-merge');

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

  debug('Starting document updates merge job');

  const cursor = await fetchCounter(database, 'document.updates.merge.cursor');

  const cutoffTime = new Date();
  cutoffTime.setTime(
    cutoffTime.getTime() - config.jobs.documentUpdatesMerge.cutoffWindow * 1000
  );

  let mergedGroups = 0;
  let deletedUpdates = 0;
  let hasMore = true;
  const currentCursor = cursor;

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

    debug(`Processing batch of ${updates.length} updates`);

    const documentIds = [
      ...new Set(updates.map((update) => update.document_id)),
    ];

    const maxRevision = updates.reduce((max, update) => {
      const rev = BigInt(update.revision);
      return rev > max ? rev : max;
    }, BigInt(0));

    for (const documentId of documentIds) {
      const result = await processDocumentUpdates(
        documentId,
        maxRevision,
        cutoffTime,
        config.jobs.documentUpdatesMerge.mergeWindow
      );
      mergedGroups += result.mergedGroups;
      deletedUpdates += result.deletedUpdates;
    }

    await setCounter(database, 'document.updates.merge.cursor', maxRevision);

    if (updates.length < config.jobs.documentUpdatesMerge.batchSize) {
      hasMore = false;
    }
  }

  debug(
    `Document updates merge job completed. Merged ${mergedGroups} groups, deleted ${deletedUpdates} redundant updates`
  );
};

const processDocumentUpdates = async (
  documentId: string,
  maxRevision: bigint,
  cutoffTime: Date,
  mergeWindow: number
): Promise<{ mergedGroups: number; deletedUpdates: number }> => {
  const allDocumentUpdates = await database
    .selectFrom('document_updates')
    .selectAll()
    .where('document_id', '=', documentId)
    .where('revision', '<=', maxRevision.toString())
    .where('created_at', '<', cutoffTime)
    .orderBy('created_at', 'asc')
    .execute();

  if (allDocumentUpdates.length < 2) {
    return { mergedGroups: 0, deletedUpdates: 0 };
  }

  const timeGroups = groupUpdatesByMergeWindow(allDocumentUpdates, mergeWindow);

  let mergedGroups = 0;
  let deletedUpdates = 0;

  for (const timeGroup of timeGroups) {
    if (timeGroup.length >= 2) {
      const success = await mergeUpdatesGroup(documentId, timeGroup);
      if (success) {
        mergedGroups++;
        deletedUpdates += timeGroup.length - 1;
      }
    }
  }

  return { mergedGroups, deletedUpdates };
};

const groupUpdatesByMergeWindow = (
  updates: SelectDocumentUpdate[],
  mergeWindow: number
): SelectDocumentUpdate[][] => {
  if (updates.length === 0) return [];

  const sortedUpdates = [...updates].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime()
  );

  const timeGroups: SelectDocumentUpdate[][] = [];
  let currentGroup: SelectDocumentUpdate[] = [sortedUpdates[0]!];

  for (let i = 1; i < sortedUpdates.length; i++) {
    const currentUpdate = sortedUpdates[i]!;
    const lastUpdateInGroup = currentGroup[currentGroup.length - 1]!;

    const timeDiff =
      currentUpdate.created_at.getTime() -
      lastUpdateInGroup.created_at.getTime();
    const timeDiffSeconds = timeDiff / 1000;

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
    const sortedUpdates = [...updates].sort((a, b) => {
      const revA = BigInt(a.revision);
      const revB = BigInt(b.revision);
      if (revA > revB) {
        return 1;
      } else if (revA < revB) {
        return -1;
      }
      return 0;
    });

    const updateData = sortedUpdates.map((update) => update.data);
    const mergedState = mergeUpdates(updateData);

    const lastUpdate = sortedUpdates[sortedUpdates.length - 1]!;
    const mergedUpdatesMetadata: UpdateMergeMetadata[] = sortedUpdates
      .slice(0, -1) // All except the last
      .map((update) => ({
        id: update.id,
        createdAt: update.created_at.toISOString(),
        createdBy: update.created_by,
      }));

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

      const updateIdsToDelete = sortedUpdates.slice(0, -1).map((u) => u.id);
      if (updateIdsToDelete.length > 0) {
        await trx
          .deleteFrom('document_updates')
          .where('id', 'in', updateIdsToDelete)
          .execute();
      }
    });

    return true;
  } catch (error) {
    debug(`Failed to merge updates for document ${documentId}: ${error}`);
    return false;
  }
};
