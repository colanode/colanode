import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { NodeType } from '@colanode/core';

import { configuration } from '@/lib/configuration';
import { enrichChunk } from '@/services/llm-service';
import { TextChunk } from '@/types/chunking';

export const chunkText = async (
  text: string,
  existingChunks: TextChunk[],
  nodeType: NodeType
): Promise<TextChunk[]> => {
  const chunkSize = configuration.ai.chunking.defaultChunkSize;
  const chunkOverlap = configuration.ai.chunking.defaultOverlap;
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const docs = await splitter.createDocuments([text]);
  const chunks = docs
    .map((doc) => ({ text: doc.pageContent }))
    .filter((c) => c.text.trim().length > 5);

  if (!configuration.ai.chunking.enhanceWithContext) {
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
