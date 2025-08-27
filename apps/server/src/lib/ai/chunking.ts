import { generateText } from 'ai';
import type { NodeType } from '@colanode/core';
import { config } from '@colanode/server/lib/config';
import { TextChunk } from '@colanode/server/types/chunking';
import { ModelConfig } from './ai-models';

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
  const docChunks = await recursiveCharacterSplit(text, {
    chunkSize,
    chunkOverlap,
    keepSeparator: true,
  });

  const chunks: TextChunk[] = docChunks
    .map((c) => ({ text: c }))
    .filter((c: TextChunk) => c.text.trim().length > 5);

  console.log('chunks', chunks);

  if (!config.ai.chunking.enhanceWithContext) {
    return chunks; // return plain chunks without summaries
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

    const { text } = await generateText({
      model: ModelConfig.forContextEnhancer(),
      prompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chunk-enrichment',
        metadata: {
          stage: 'chunk-enrichment',
          nodeType,
          chunkLength: chunk.length,
        },
      },
    });

    return text.trim();
  } catch (error) {
    console.warn('Failed to enrich chunk:', error);
    return undefined;
  }
};

/**
 * Recursive character splitter.
 * - Ordered separators: ["\n\n", "\n", " ", ""]
 * - keepSeparator: when true, boundaries are preserved on the next chunk
 * - chunkOverlap is applied during merge
 *
 */
export async function recursiveCharacterSplit(
  text: string,
  {
    chunkSize,
    chunkOverlap = 0,
    keepSeparator = true,
    separators = ['\n\n', '\n', ' ', ''],
    lengthFn,
  }: {
    chunkSize: number;
    chunkOverlap?: number;
    keepSeparator?: boolean;
    separators?: string[];
    lengthFn?: (s: string) => number | Promise<number>;
  }
): Promise<string[]> {
  if (chunkSize <= 0) throw new Error('chunkSize must be > 0');
  if (chunkOverlap < 0) throw new Error('chunkOverlap must be >= 0');
  if (chunkOverlap >= chunkSize) {
    throw new Error('Cannot have chunkOverlap >= chunkSize');
  }

  const len = async (s: string) =>
    (lengthFn ? await lengthFn(s) : s.length) as number;

  const escapeRegExp = (lit: string) =>
    lit.replace(/[\/\\^$*+?.()|[\]{}-]/g, '\\$&');

  const splitOnSeparator = (t: string, sep: string, keep: boolean) => {
    let splits: string[];
    if (sep) {
      if (keep) {
        const re = new RegExp(`(?=${escapeRegExp(sep)})`, 'g');
        splits = t.split(re);
      } else {
        splits = t.split(sep);
      }
    } else {
      splits = t.split('');
    }
    return splits.filter((s) => s !== '');
  };

  const joinDocs = (docs: string[], sep: string): string | null => {
    const joined = docs.join(sep).trim();
    return joined === '' ? null : joined;
  };

  const mergeSplits = async (splits: string[], sep: string) => {
    const out: string[] = [];
    const cur: string[] = [];
    let total = 0;

    for (const d of splits) {
      const l = await len(d);

      if (total + l + cur.length * sep.length > chunkSize) {
        if (total > chunkSize) {
          // parity with LC: warn but continue
          console.warn(
            `Created a chunk of size ${total}, which is longer than the specified ${chunkSize}`
          );
        }
        if (cur.length > 0) {
          const doc = joinDocs(cur, sep);
          if (doc !== null) out.push(doc);

          // pop from the left until overlap satisfied or still too big
          while (
            total > chunkOverlap ||
            (total + l + cur.length * sep.length > chunkSize && total > 0)
          ) {
            total -= await len(cur[0]!);
            cur.shift();
          }
        }
      }

      cur.push(d);
      total += l;
    }

    const doc = joinDocs(cur, sep);
    if (doc !== null) out.push(doc);
    return out;
  };

  const _split = async (t: string, seps: string[]): Promise<string[]> => {
    const finalChunks: string[] = [];

    // choose separator: first present wins, else last fallback
    let sep = seps[seps.length - 1] || '';
    let nextSeps: string[] | undefined;
    for (let i = 0; i < seps.length; i++) {
      const s = seps[i];
      if (s === undefined) continue;
      if (s === '') {
        sep = s;
        break;
      }
      if (t.includes(s)) {
        sep = s;
        nextSeps = seps.slice(i + 1);
        break;
      }
    }

    const splits = splitOnSeparator(t, sep, keepSeparator);
    const mergeSep = keepSeparator ? '' : sep;

    let good: string[] = [];
    for (const s of splits) {
      if ((await len(s)) < chunkSize) {
        good.push(s);
      } else {
        if (good.length) {
          const merged = await mergeSplits(good, mergeSep);
          finalChunks.push(...merged);
          good = [];
        }
        if (!nextSeps) {
          finalChunks.push(s); // no finer separators left
        } else {
          const rec = await _split(s, nextSeps);
          finalChunks.push(...rec);
        }
      }
    }

    if (good.length) {
      const merged = await mergeSplits(good, mergeSep);
      finalChunks.push(...merged);
    }

    return finalChunks;
  };

  return _split(text, separators);
}
