import { embedMany } from 'ai';
import { sql } from 'kysely';

import { extractDocumentText, getNodeModel } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { CreateDocumentEmbedding } from '@colanode/server/data/schema';
import { JobHandler } from '@colanode/server/jobs';
import { chunkText } from '@colanode/server/lib/ai/chunking';
import { getEmbeddingModel } from '@colanode/server/lib/ai/models';
import { config } from '@colanode/server/lib/config';
import { fetchNode } from '@colanode/server/lib/nodes';

export type DocumentEmbedInput = {
  type: 'document.embed';
  documentId: string;
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'document.embed': {
      input: DocumentEmbedInput;
    };
  }
}

export const documentEmbedHandler: JobHandler<DocumentEmbedInput> = async (
  input
) => {
  try {
    if (!config.ai.enabled) {
      return;
    }

    console.log('document embed job', input);

    const { documentId } = input;
    const document = await database
      .selectFrom('documents')
      .select(['id', 'content', 'workspace_id', 'created_at', 'revision'])
      .where('id', '=', documentId)
      .executeTakeFirst();

    console.log('document', document?.id);
    if (!document) {
      console.log('document not found');
      return;
    }

    const node = await fetchNode(documentId);
    if (!node) {
      console.log('node not found');
      return;
    }

    const nodeModel = getNodeModel(node.type);
    if (!nodeModel?.documentSchema) {
      console.log('node model not found');
      return;
    }

    const text = extractDocumentText(node.id, document.content);
    if (!text || text.trim() === '') {
      await database
        .deleteFrom('document_embeddings')
        .where('document_id', '=', documentId)
        .execute();

      console.log('no text');
      return;
    }

    console.log('sending request to openai');

    console.log('config.ai.embedding.apiKey', config.ai.embedding.apiKey);

    const embeddingModel = getEmbeddingModel();

    console.log('getting existing embeddings');
    const existingEmbeddings = await database
      .selectFrom('document_embeddings')
      .select(['chunk', 'revision', 'text', 'summary'])
      .where('document_id', '=', documentId)
      .execute();

    console.log('existing embeddings', existingEmbeddings.length);

    const revision =
      existingEmbeddings.length > 0 ? existingEmbeddings[0]!.revision : 0n;

    if (revision >= document.revision) {
      console.log('revision is up to date');
      return;
    }

    const textChunks = await chunkText(
      text,
      existingEmbeddings.map((e: { text: string; summary: string | null }) => ({
        text: e.text,
        summary: e.summary ?? undefined,
      })),
      node.type
    );

    const embeddingsToUpsert: CreateDocumentEmbedding[] = [];
    console.log('textChunks', textChunks.length);
    for (let i = 0; i < textChunks.length; i++) {
      console.log('chunk', i);
      const chunk = textChunks[i];
      if (!chunk) {
        console.log('chunk is undefined');
        continue;
      }

      const existing = existingEmbeddings.find(
        (e: { chunk: number; text: string }) => e.chunk === i
      );
      if (existing && existing.text === chunk.text) {
        console.log('chunk already exists');
        continue;
      }

      embeddingsToUpsert.push({
        document_id: documentId,
        chunk: i,
        revision: document.revision,
        workspace_id: document.workspace_id,
        text: chunk.text,
        summary: chunk.summary,
        embedding_vector: [],
        created_at: new Date(),
      });
    }

    console.log('embeddingsToUpsert', embeddingsToUpsert.length);

    const batchSize = config.ai.embedding.batchSize;
    for (let i = 0; i < embeddingsToUpsert.length; i += batchSize) {
      const batch = embeddingsToUpsert.slice(i, i + batchSize);
      const textsToEmbed = batch.map((item) =>
        item.summary ? `${item.summary}\n\n${item.text}` : item.text
      );

      console.log('calling embedMany');
      const { embeddings: embeddingVectors } = await embedMany({
        model: embeddingModel,
        values: textsToEmbed,
        providerOptions: {
          openai: {
            dimensions: config.ai.embedding.dimensions,
          },
        },
      });

      console.log('embedding vectors', embeddingVectors.length);
      for (let j = 0; j < batch.length; j++) {
        const vector = embeddingVectors[j];
        const batchItem = batch[j];
        if (batchItem) {
          batchItem.embedding_vector = vector ?? [];
        }
      }
    }

    // Filter out entries with empty vectors
    const ready = embeddingsToUpsert.filter(
      (e) => e.embedding_vector.length > 0
    );
    if (ready.length === 0) {
      console.log('no embeddings to upsert');
      return;
    }

    console.log('upserting embeddings');
    await database
      .insertInto('document_embeddings')
      .values(
        ready.map((embedding) => ({
          document_id: embedding.document_id,
          chunk: embedding.chunk,
          revision: embedding.revision,
          workspace_id: embedding.workspace_id,
          text: embedding.text,
          summary: embedding.summary,
          embedding_vector: sql.raw(
            `'[${embedding.embedding_vector.join(',')}]'::vector`
          ),
          created_at: embedding.created_at,
        }))
      )
      .onConflict((oc: any) =>
        oc.columns(['document_id', 'chunk']).doUpdateSet({
          text: sql.ref('excluded.text'),
          summary: sql.ref('excluded.summary'),
          embedding_vector: sql.ref('excluded.embedding_vector'),
          updated_at: new Date(),
        })
      )
      .execute();
  } catch (error) {
    console.log('error upserting embeddings', error);
    throw error;
  } finally {
    console.log('clearing document embedding schedule');
  }
};
