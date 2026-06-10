import { Transaction } from 'kysely';

import {
  CreateNodeReference,
  SelectNodeReference,
  WorkspaceDatabaseSchema,
} from '@colanode/client/databases/workspace/schema';
import { applyMentionUpdates, checkMentionChanges } from '@colanode/client/lib/mentions';
import { NodeAttributes, NodeModel } from '@colanode/core';

export type TagChangeResult = {
  addedTags: string[];
  removedTags: string[];
};

export const extractTagIds = (attributes: NodeAttributes): string[] => {
  if ('tagIds' in attributes && Array.isArray(attributes.tagIds)) {
    return attributes.tagIds;
  }

  return [];
};

export const checkTagChanges = (
  beforeTags: string[],
  afterTags: string[]
): TagChangeResult => {
  return {
    addedTags: afterTags.filter((tagId) => !beforeTags.includes(tagId)),
    removedTags: beforeTags.filter((tagId) => !afterTags.includes(tagId)),
  };
};

export const buildTagNodeReferences = (
  nodeId: string,
  tagIds: string[],
  userId: string,
  date: string
): CreateNodeReference[] => {
  return tagIds.map((tagId) => ({
    node_id: nodeId,
    reference_id: tagId,
    inner_id: tagId,
    type: 'tag',
    created_at: date,
    created_by: userId,
  }));
};

export const buildNodeReferencesToCreate = (
  nodeId: string,
  attributes: NodeAttributes,
  model: NodeModel,
  userId: string,
  date: string
): CreateNodeReference[] => {
  const mentions = model.extractMentions(nodeId, attributes);
  const mentionReferences: CreateNodeReference[] = mentions.map((mention) => ({
    node_id: nodeId,
    reference_id: mention.target,
    inner_id: mention.id,
    type: 'mention',
    created_at: date,
    created_by: userId,
  }));

  return [
    ...mentionReferences,
    ...buildTagNodeReferences(nodeId, extractTagIds(attributes), userId, date),
  ];
};

export const applyTagUpdates = async (
  transaction: Transaction<WorkspaceDatabaseSchema>,
  nodeId: string,
  userId: string,
  date: string,
  updateResult: TagChangeResult
) => {
  const createdNodeReferences: SelectNodeReference[] = [];
  const deletedNodeReferences: SelectNodeReference[] = [];

  for (const tagId of updateResult.addedTags) {
    const createdNodeReference = await transaction
      .insertInto('node_references')
      .returningAll()
      .values({
        node_id: nodeId,
        reference_id: tagId,
        inner_id: tagId,
        type: 'tag',
        created_at: date,
        created_by: userId,
      })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();

    if (!createdNodeReference) {
      continue;
    }

    createdNodeReferences.push(createdNodeReference);
  }

  for (const tagId of updateResult.removedTags) {
    const deletedNodeReference = await transaction
      .deleteFrom('node_references')
      .where('node_id', '=', nodeId)
      .where('reference_id', '=', tagId)
      .where('inner_id', '=', tagId)
      .where('type', '=', 'tag')
      .returningAll()
      .executeTakeFirst();

    if (!deletedNodeReference) {
      throw new Error('Failed to delete tag reference');
    }

    deletedNodeReferences.push(deletedNodeReference);
  }

  return { createdNodeReferences, deletedNodeReferences };
};

export const applyNodeReferenceUpdates = async (
  transaction: Transaction<WorkspaceDatabaseSchema>,
  nodeId: string,
  userId: string,
  date: string,
  model: NodeModel,
  beforeAttributes: NodeAttributes,
  afterAttributes: NodeAttributes
) => {
  const mentionChanges = checkMentionChanges(
    model.extractMentions(nodeId, beforeAttributes),
    model.extractMentions(nodeId, afterAttributes)
  );
  const tagChanges = checkTagChanges(
    extractTagIds(beforeAttributes),
    extractTagIds(afterAttributes)
  );

  const mentionResult = await applyMentionUpdates(
    transaction,
    nodeId,
    userId,
    date,
    mentionChanges
  );
  const tagResult = await applyTagUpdates(
    transaction,
    nodeId,
    userId,
    date,
    tagChanges
  );

  return {
    createdNodeReferences: [
      ...mentionResult.createdNodeReferences,
      ...tagResult.createdNodeReferences,
    ],
    deletedNodeReferences: [
      ...mentionResult.deletedNodeReferences,
      ...tagResult.deletedNodeReferences,
    ],
  };
};
