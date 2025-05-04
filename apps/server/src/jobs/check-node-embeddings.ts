import { getNodeModel } from '@colanode/core';

import { database } from '@/data/database';
import { config } from '@/lib/config';
import {
  fetchEmbeddingCursor,
  scheduleNodeEmbedding,
  updateEmbeddingCursor,
} from '@/lib/ai/embeddings';

const BATCH_SIZE = 100;

export type CheckNodeEmbeddingsInput = {
  type: 'check_node_embeddings';
};

declare module '@/types/jobs' {
  interface JobMap {
    check_node_embeddings: {
      input: CheckNodeEmbeddingsInput;
    };
  }
}

export const checkNodeEmbeddingsHandler = async () => {
  if (!config.ai.enabled) {
    return;
  }

  const cursor = await fetchEmbeddingCursor('node_embeddings');
  let hasMore = true;
  let lastRevision = cursor;

  while (hasMore) {
    const nodes = await database
      .selectFrom('nodes')
      .selectAll()
      .where('revision', '>=', lastRevision)
      .orderBy('revision', 'asc')
      .limit(BATCH_SIZE)
      .execute();

    if (nodes.length === 0) {
      hasMore = false;
      continue;
    }

    for (const node of nodes) {
      const nodeModel = getNodeModel(node.attributes.type);
      if (!nodeModel) {
        continue;
      }

      const nodeText = nodeModel.extractText(node.id, node.attributes);
      if (!nodeText) {
        continue;
      }

      if (nodeText === null) {
        continue;
      }

      if (!nodeText.attributes || nodeText.attributes.trim() === '') {
        await database
          .deleteFrom('node_embeddings')
          .where('node_id', '=', node.id)
          .execute();

        continue;
      }

      const firstEmbedding = await database
        .selectFrom('node_embeddings')
        .select(['revision'])
        .where('node_id', '=', node.id)
        .orderBy('created_at', 'asc')
        .executeTakeFirst();

      const revision = firstEmbedding?.revision ?? '0';
      if (revision >= node.revision) {
        continue;
      }

      await scheduleNodeEmbedding(node);
    }

    if (nodes.length > 0) {
      lastRevision = nodes[nodes.length - 1]?.revision ?? '0';
    }

    if (nodes.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  await updateEmbeddingCursor('node_embeddings', lastRevision);
};
