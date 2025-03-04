import { MessageAttributes } from '@colanode/core';

import { redis } from '@/data/redis';
import { SelectNode } from '@/data/schema';
import { configuration } from '@/lib/configuration';
import { jobService } from '@/services/job-service';

export const fetchEmbeddingCursor = async (
  cursorId: string
): Promise<bigint> => {
  const cursorStringValue = await redis.get(`embedding_cursor:${cursorId}`);
  if (!cursorStringValue) {
    return 0n;
  }

  return BigInt(cursorStringValue);
};

export const updateEmbeddingCursor = async (
  cursorId: string,
  value: bigint
) => {
  await redis.set(`embedding_cursor:${cursorId}`, value.toString());
};

export const deleteEmbeddingCursor = async (cursorId: string) => {
  await redis.del(`embedding_cursor:${cursorId}`);
};

export const scheduleNodeEmbedding = async (node: SelectNode) => {
  if (node.type === 'message') {
    const attributes = node.attributes as MessageAttributes;
    if (attributes.subtype === 'question' || attributes.subtype === 'answer') {
      return;
    }
  }

  const jobOptions: { jobId: string; delay?: number } = {
    jobId: `embed_node:${node.id}`,
  };

  // Only add delay for non-message nodes
  if (node.type !== 'message') {
    jobOptions.delay = configuration.ai.nodeEmbeddingDelay;
  }

  await jobService.addJob(
    {
      type: 'embed_node',
      nodeId: node.id,
    },
    jobOptions
  );
};

export const scheduleDocumentEmbedding = async (documentId: string) => {
  await jobService.addJob(
    {
      type: 'embed_document',
      documentId,
    },
    {
      jobId: `embed_document:${documentId}`,
      delay: configuration.ai.documentEmbeddingDelay,
    }
  );
};
