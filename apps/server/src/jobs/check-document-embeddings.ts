import { extractDocumentText } from '@colanode/core';

import { database } from '@/data/database';
import { config } from '@/lib/config';
import {
  fetchEmbeddingCursor,
  scheduleDocumentEmbedding,
  updateEmbeddingCursor,
} from '@/lib/ai/embeddings';

const BATCH_SIZE = 100;

export type CheckDocumentEmbeddingsInput = {
  type: 'check_document_embeddings';
};

declare module '@/types/jobs' {
  interface JobMap {
    check_document_embeddings: {
      input: CheckDocumentEmbeddingsInput;
    };
  }
}

export const checkDocumentEmbeddingsHandler = async () => {
  if (!config.ai.enabled) {
    return;
  }

  const cursor = await fetchEmbeddingCursor('document_embeddings');
  let hasMore = true;
  let lastRevision = cursor;

  while (hasMore) {
    const documents = await database
      .selectFrom('documents')
      .selectAll()
      .where('revision', '>=', lastRevision)
      .orderBy('revision', 'asc')
      .limit(BATCH_SIZE)
      .execute();

    if (documents.length === 0) {
      hasMore = false;
      continue;
    }

    for (const document of documents) {
      const text = extractDocumentText(document.id, document.content);
      if (!text || text.trim() === '') {
        await database
          .deleteFrom('document_embeddings')
          .where('document_id', '=', document.id)
          .execute();

        return;
      }

      const firstEmbedding = await database
        .selectFrom('document_embeddings')
        .select(['revision'])
        .where('document_id', '=', document.id)
        .orderBy('created_at', 'asc')
        .executeTakeFirst();

      const revision = firstEmbedding?.revision ?? '0';
      if (revision >= document.revision) {
        continue;
      }

      await scheduleDocumentEmbedding(document.id);
    }

    if (documents.length > 0) {
      lastRevision = documents[documents.length - 1]?.revision ?? '0';
    }

    if (documents.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  await updateEmbeddingCursor('document_embeddings', lastRevision);
};
