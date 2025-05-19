import { Transaction } from 'kysely';

import {
  WorkspaceDatabaseSchema,
  SelectNodeReference,
} from '@colanode/client/databases/workspace/schema';
import { Mention } from '@colanode/core';

type MentionChangeResult = {
  addedMentions: Mention[];
  removedMentions: Mention[];
};

const mentionEquals = (a: Mention, b: Mention) =>
  a.id === b.id && a.target === b.target;

export const checkMentionChanges = (
  beforeMentions: Mention[],
  afterMentions: Mention[]
): MentionChangeResult => {
  const addedMentions = afterMentions.filter(
    (after) => !beforeMentions.some((before) => mentionEquals(before, after))
  );
  const removedMentions = beforeMentions.filter(
    (before) => !afterMentions.some((after) => mentionEquals(before, after))
  );

  return {
    addedMentions,
    removedMentions,
  };
};

export const applyMentionUpdates = async (
  transaction: Transaction<WorkspaceDatabaseSchema>,
  nodeId: string,
  userId: string,
  date: string,
  updateResult: MentionChangeResult
) => {
  const createdNodeReferences: SelectNodeReference[] = [];
  const deletedNodeReferences: SelectNodeReference[] = [];

  for (const mention of updateResult.addedMentions) {
    const createdNodeReference = await transaction
      .insertInto('node_references')
      .returningAll()
      .values({
        node_id: nodeId,
        reference_id: mention.target,
        inner_id: mention.id,
        type: 'mention',
        created_at: date,
        created_by: userId,
      })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();

    if (!createdNodeReference) {
      throw new Error('Failed to create node reference');
    }

    createdNodeReferences.push(createdNodeReference);
  }

  for (const mention of updateResult.removedMentions) {
    const deletedNodeReference = await transaction
      .deleteFrom('node_references')
      .where('node_id', '=', nodeId)
      .where('reference_id', '=', mention.target)
      .where('inner_id', '=', mention.id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedNodeReference) {
      throw new Error('Failed to delete node reference');
    }

    deletedNodeReferences.push(deletedNodeReference);
  }

  return { createdNodeReferences, deletedNodeReferences };
};
