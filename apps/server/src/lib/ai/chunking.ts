import { MDocument } from '@mastra/rag';
import type { NodeType } from '@colanode/core';
import { config } from '@colanode/server/lib/config';
import { TextChunk } from '@colanode/server/types/chunking';
import { createChunkEnrichmentAgent } from './ai-agents';

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

  const doc = MDocument.fromText(text);
  const docChunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: chunkSize,
    overlap: chunkOverlap,
  });

  const chunks = docChunks
    .map((chunk) => ({ text: chunk.text }))
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

const enrichChunk = async (
  chunk: string,
  fullText: string,
  nodeType: NodeType
): Promise<string | undefined> => {
  try {
    const enrichmentAgent = createChunkEnrichmentAgent();

    const prompt = `<task>
Generate a concise summary of the following text chunk that is part of a larger document. 
This summary will be used to enhance vector search retrieval by providing additional context about this specific chunk.
</task>

<context>
Content Type: ${nodeType}
</context>

<guidelines>
1. Create a brief (30-50 words) summary that captures the key points and main idea of the chunk
2. Consider how this chunk fits into the overall document provided
3. If the chunk appears to be part of a specific section, identify its role or purpose
4. If the chunk contains structured data (like a database record), identify the type of information it represents
5. Use neutral, descriptive language
6. Consider the content type ("${nodeType}") when creating the summary - different types have different purposes:
   - "message": Communication content in a conversation
   - "page": Document-like content with structured information
   - "record": Database record with specific fields and values
   - Other types: Adapt your summary accordingly
</guidelines>

<complete_document>
${fullText}
</complete_document>

<chunk_to_summarize>
${chunk}
</chunk_to_summarize>

<output_format>
Provide only the summary with no additional commentary or explanations.
</output_format>`;

    const response = await enrichmentAgent.generate([
      { role: 'user', content: prompt },
    ]);

    return response.text.trim();
  } catch (error) {
    console.warn('Failed to enrich chunk:', error);
    return undefined;
  }
};
