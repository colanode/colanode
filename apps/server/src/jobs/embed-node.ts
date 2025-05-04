import { OpenAIEmbeddings } from '@langchain/openai';
import { sql } from 'kysely';
import { getNodeModel } from '@colanode/core';

import { chunkText } from '@/lib/ai/chunking';
import { database } from '@/data/database';
import { config } from '@/lib/config';
import { CreateNodeEmbedding } from '@/data/schema';
import { fetchNode } from '@/lib/nodes';

export type EmbedNodeInput = {
  type: 'embed_node';
  nodeId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    embed_node: {
      input: EmbedNodeInput;
    };
  }
}

export const embedNodeHandler = async (input: {
  type: 'embed_node';
  nodeId: string;
}) => {
  if (!config.ai.enabled) {
    return;
  }

  const { nodeId } = input;
  const node = await fetchNode(nodeId);

  if (!node) {
    return;
  }

  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel) {
    return;
  }

  const nodeText = nodeModel.extractText(node.id, node.attributes);
  if (!nodeText) {
    return;
  }

  if (nodeText === null) {
    return;
  }

  if (!nodeText.attributes || nodeText.attributes.trim() === '') {
    await database
      .deleteFrom('node_embeddings')
      .where('node_id', '=', nodeId)
      .execute();

    return;
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey: config.ai.embedding.apiKey,
    modelName: config.ai.embedding.modelName,
    dimensions: config.ai.embedding.dimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('node_embeddings')
    .select(['chunk', 'revision', 'text', 'summary'])
    .where('node_id', '=', nodeId)
    .execute();

  const revision =
    existingEmbeddings.length > 0 ? existingEmbeddings[0]!.revision : 0n;

  if (revision >= node.revision) {
    return;
  }

  const fullText =
    `${nodeText.name ?? ''}\n\n${nodeText.attributes ?? ''}`.trim();

  const textChunks = await chunkText(
    fullText,
    existingEmbeddings.map((e) => ({
      text: e.text,
      summary: e.summary ?? undefined,
    })),
    node.type
  );

  const embeddingsToUpsert: CreateNodeEmbedding[] = [];
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    if (!chunk) {
      continue;
    }

    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === chunk.text) {
      continue;
    }

    embeddingsToUpsert.push({
      node_id: nodeId,
      chunk: i,
      revision: node.revision,
      workspace_id: node.workspace_id,
      text: chunk.text,
      summary: chunk.summary,
      embedding_vector: [],
      created_at: new Date(),
    });
  }

  if (embeddingsToUpsert.length === 0) {
    return;
  }

  const batchSize = config.ai.embedding.batchSize;
  for (let i = 0; i < embeddingsToUpsert.length; i += batchSize) {
    const batch = embeddingsToUpsert.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) =>
      item.summary ? `${item.summary}\n\n${item.text}` : item.text
    );

    const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);
    for (let j = 0; j < batch.length; j++) {
      const vector = embeddingVectors[j];
      const batchItem = batch[j];
      if (batchItem) {
        batchItem.embedding_vector = vector ?? [];
      }
    }
  }

  await database
    .insertInto('node_embeddings')
    .values(
      embeddingsToUpsert.map((embedding) => ({
        node_id: embedding.node_id,
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
    .onConflict((oc) =>
      oc.columns(['node_id', 'chunk']).doUpdateSet({
        text: sql.ref('excluded.text'),
        summary: sql.ref('excluded.summary'),
        embedding_vector: sql.ref('excluded.embedding_vector'),
        updated_at: new Date(),
      })
    )
    .execute();
};
