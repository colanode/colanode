import { createDebugger, UpdateMergeMetadata } from '@colanode/core';
import { mergeUpdates } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import { SelectNodeUpdate } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import { config } from '@colanode/server/lib/config';
import { fetchCounter, setCounter } from '@colanode/server/lib/counters';

const debug = createDebugger('server:job:node-updates-merge');

export type NodeUpdatesMergeInput = {
  type: 'node.updates.merge';
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'node.updates.merge': {
      input: NodeUpdatesMergeInput;
    };
  }
}

export const nodeUpdatesMergeHandler: JobHandler<
  NodeUpdatesMergeInput
> = async () => {
  if (!config.jobs.nodeUpdatesMerge.enabled) {
    return;
  }

  debug('Starting node updates merge job');

  const cursor = await fetchCounter(database, 'node.updates.merge.cursor');

  const cutoffTime = new Date();
  cutoffTime.setTime(
    cutoffTime.getTime() - config.jobs.nodeUpdatesMerge.cutoffWindow * 1000
  );

  let mergedGroups = 0;
  let deletedUpdates = 0;
  let hasMore = true;
  let currentCursor = cursor;

  while (hasMore) {
    const updates = await database
      .selectFrom('node_updates')
      .selectAll()
      .where('revision', '>', currentCursor.toString())
      .where('created_at', '<', cutoffTime)
      .orderBy('revision', 'asc')
      .limit(config.jobs.nodeUpdatesMerge.batchSize)
      .execute();

    if (updates.length === 0) {
      hasMore = false;
      continue;
    }

    debug(`Processing batch of ${updates.length} updates`);

    const nodesMap = new Map<string, SelectNodeUpdate[]>();
    for (const update of updates) {
      const nodeUpdates = nodesMap.get(update.node_id) ?? [];
      nodeUpdates.push(update);
      nodesMap.set(update.node_id, nodeUpdates);
    }

    const maxRevision = updates.reduce((max, update) => {
      const rev = BigInt(update.revision);
      return rev > max ? rev : max;
    }, BigInt(0));

    for (const [nodeId, nodeUpdates] of nodesMap.entries()) {
      const result = await processNodeUpdates(
        nodeId,
        nodeUpdates,
        config.jobs.nodeUpdatesMerge.mergeWindow
      );
      mergedGroups += result.mergedGroups;
      deletedUpdates += result.deletedUpdates;
    }

    await setCounter(database, 'node.updates.merge.cursor', maxRevision);
    currentCursor = maxRevision;

    if (updates.length < config.jobs.nodeUpdatesMerge.batchSize) {
      hasMore = false;
    }
  }

  debug(
    `Node updates merge job completed. Merged ${mergedGroups} groups, deleted ${deletedUpdates} redundant updates`
  );
};

const processNodeUpdates = async (
  nodeId: string,
  nodeUpdates: SelectNodeUpdate[],
  mergeWindow: number
): Promise<{ mergedGroups: number; deletedUpdates: number }> => {
  const firstUpdate = nodeUpdates[0]!;
  const cutoffTime = new Date(
    firstUpdate.created_at.getTime() - 60 * 60 * 1000
  );

  const previousUpdate = await database
    .selectFrom('node_updates')
    .selectAll()
    .where('node_id', '=', nodeId)
    .where('revision', '<', firstUpdate.revision)
    .where('created_at', '>=', cutoffTime)
    .executeTakeFirst();

  const allUpdates = [...nodeUpdates];
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

    const success = await mergeUpdatesGroup(nodeId, group);
    if (success) {
      mergedGroups++;
      deletedUpdates += group.length - 1;
    }
  }

  return { mergedGroups, deletedUpdates };
};

const groupUpdatesByMergeWindow = (
  updates: SelectNodeUpdate[],
  mergeWindow: number
): SelectNodeUpdate[][] => {
  if (updates.length === 0) return [];

  const timeGroups: SelectNodeUpdate[][] = [];
  let currentGroup: SelectNodeUpdate[] = [updates[0]!];

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
  nodeId: string,
  updates: SelectNodeUpdate[]
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
        .updateTable('node_updates')
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
        .deleteFrom('node_updates')
        .where('id', 'in', updatesToMergeIds)
        .execute();
    });

    return true;
  } catch (error) {
    debug(`Failed to merge updates for node ${nodeId}: ${error}`);
    return false;
  }
};
