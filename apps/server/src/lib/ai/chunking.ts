import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import type { NodeType } from '@colanode/core';
import { enrichChunk } from '@colanode/server/lib/ai/llms';
import { config } from '@colanode/server/lib/config';
import { TextChunk } from '@colanode/server/types/chunking';

export const chunkText = async (
  text: string,
  existingChunks: TextChunk[],
  nodeType: NodeType
): Promise<TextChunk[]> => {
  if (!config.ai.enabled) {
    return [];
  }

  const chunkSize = config.ai.chunking.defaultChunkSize;
  const chunkOverlap = config.ai.chunking.defaultOverlap;
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const docs = await splitter.createDocuments([text]);
  const chunks = docs
    .map((doc) => ({ text: doc.pageContent }))
    .filter((c) => c.text.trim().length > 5);

  if (!config.ai.chunking.enhanceWithContext) {
    return chunks;
  }

  const enrichedChunks: TextChunk[] = [];
  for (const chunk of chunks) {
    const existingChunk = existingChunks.find((ec) => ec.text === chunk.text);
    if (existingChunk?.summary) {
      enrichedChunks.push({
        text: chunk.text,
        summary: existingChunk.summary,
      });

      continue;
    }

    const summary = await enrichChunk(chunk.text, text, nodeType);
    enrichedChunks.push({ text: chunk.text, summary });
  }

  return enrichedChunks;
};
