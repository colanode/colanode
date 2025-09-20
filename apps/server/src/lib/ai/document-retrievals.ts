import { AIDocument } from '@colanode/server/lib/ai/utils';
import { embed } from 'ai';
import { sql } from 'kysely';

import { database } from '@colanode/server/data/database';
import { combineAndScoreSearchResults } from '@colanode/server/lib/ai/utils';
import { config } from '@colanode/server/lib/config';
import { getEmbeddingModel } from '@colanode/server/lib/ai/models';
import { QueryRewriteOutput } from '@colanode/server/types/ai';
import { SearchResult } from '@colanode/server/types/retrieval';

export const retrieveDocuments = async (
  rewrittenQuery: QueryRewriteOutput,
  workspaceId: string,
  userId: string,
  limit?: number,
  contextNodeIds?: string[]
): Promise<AIDocument[]> => {
  if (!config.ai.enabled) {
    return [];
  }

  const maxResults = limit ?? config.ai.retrieval.hybridSearch.maxResults;

  const semanticList = Array.isArray((rewrittenQuery as any).semanticQueries)
    ? ((rewrittenQuery as any).semanticQueries as string[]).filter(
        (s) => typeof s === 'string' && s.trim().length > 0
      )
    : typeof (rewrittenQuery as any).semanticQuery === 'string' &&
        (rewrittenQuery as any).semanticQuery.trim().length > 0
      ? [(rewrittenQuery as any).semanticQuery]
      : [];
  const doSemantic = semanticList.length > 0;
  const keywordString = (rewrittenQuery as any).keywordQuery ?? '';
  const doKeyword =
    typeof keywordString === 'string' && keywordString.trim().length > 0;

  let semanticResults: SearchResult[] = [];
  if (doSemantic) {
    const embeddingModel = getEmbeddingModel();
    for (const q of semanticList) {
      const { embedding } = await embed({
        model: embeddingModel,
        value: q,
        providerOptions: {
          openai: {
            dimensions: config.ai.embedding.dimensions,
          },
        },
      });
      if (embedding) {
        const resultsForQuery = await semanticSearchDocuments(
          embedding,
          workspaceId,
          userId,
          maxResults,
          contextNodeIds
        );
        semanticResults.push(...resultsForQuery);
      }
    }

    // Deduplicate semantic results - keep highest scoring result for each unique chunk
    const deduplicatedSemanticResults: SearchResult[] = [];
    const semanticChunkMap = new Map<string, SearchResult>();

    for (const result of semanticResults) {
      const key = `${result.id}-${result.chunkIndex}`;
      const existing = semanticChunkMap.get(key);

      if (!existing || result.score > existing.score) {
        semanticChunkMap.set(key, result);
      }
    }

    deduplicatedSemanticResults.push(...semanticChunkMap.values());
    semanticResults = deduplicatedSemanticResults;
  }

  const keywordResults: SearchResult[] = doKeyword
    ? await keywordSearchDocuments(
        keywordString,
        workspaceId,
        userId,
        maxResults,
        contextNodeIds
      )
    : [];

  const res = combineSearchResults(semanticResults, keywordResults);
  console.log('res', res);
  return res;
};

const semanticSearchDocuments = async (
  embedding: number[],
  workspaceId: string,
  userId: string,
  limit: number,
  contextNodeIds?: string[]
): Promise<SearchResult[]> => {
  let queryBuilder = database
    .selectFrom('document_embeddings')
    .innerJoin('documents', 'documents.id', 'document_embeddings.document_id')
    .innerJoin('nodes', 'nodes.id', 'documents.id')
    .innerJoin('collaborations', (join) =>
      join
        .onRef('collaborations.node_id', '=', 'nodes.root_id')
        .on('collaborations.collaborator_id', '=', sql.lit(userId))
        .on('collaborations.deleted_at', 'is', null)
    )
    .select([
      'document_embeddings.document_id as id',
      'document_embeddings.text',
      'document_embeddings.summary',
      'documents.created_at',
      'documents.created_by',
      'document_embeddings.chunk as chunk_index',
      sql<number>`1 - (${sql.raw(`'[${embedding}]'::vector`)} <=> document_embeddings.embedding_vector)`.as(
        'similarity'
      ),
    ])
    .where('document_embeddings.workspace_id', '=', workspaceId);

  if (contextNodeIds && contextNodeIds.length > 0) {
    queryBuilder = queryBuilder.where(
      'document_embeddings.document_id',
      'in',
      contextNodeIds
    );
  }

  const results = await queryBuilder
    .orderBy('similarity', 'desc')
    .limit(limit)
    .execute();

  return results.map((result) => ({
    id: result.id,
    text: result.text,
    summary: result.summary,
    score: result.similarity,
    type: 'semantic',
    createdAt: result.created_at,
    createdBy: result.created_by,
    chunkIndex: result.chunk_index,
    sourceType: 'document' as const,
  }));
};

const keywordSearchDocuments = async (
  query: string,
  workspaceId: string,
  userId: string,
  limit: number,
  contextNodeIds?: string[]
): Promise<SearchResult[]> => {
  console.log('Keyword search query:', query);
  let queryBuilder = database
    .selectFrom('document_embeddings')
    .innerJoin('documents', 'documents.id', 'document_embeddings.document_id')
    .innerJoin('nodes', 'nodes.id', 'documents.id')
    .innerJoin('collaborations', (join) =>
      join
        .onRef('collaborations.node_id', '=', 'nodes.root_id')
        .on('collaborations.collaborator_id', '=', sql.lit(userId))
        .on('collaborations.deleted_at', 'is', null)
    )
    .select([
      'document_embeddings.document_id as id',
      'document_embeddings.text',
      'document_embeddings.summary',
      'documents.created_at',
      'documents.created_by',
      'document_embeddings.chunk as chunk_index',
      sql<number>`ts_rank(document_embeddings.search_vector, websearch_to_tsquery('english', ${query}))`.as(
        'rank'
      ),
    ])
    .where('document_embeddings.workspace_id', '=', workspaceId)
    .where(
      () =>
        sql`document_embeddings.search_vector @@ websearch_to_tsquery('english', ${query})`
    );

  if (contextNodeIds && contextNodeIds.length > 0) {
    queryBuilder = queryBuilder.where(
      'document_embeddings.document_id',
      'in',
      contextNodeIds
    );
  }

  const results = await queryBuilder
    .groupBy([
      'document_embeddings.document_id',
      'document_embeddings.text',
      'documents.created_at',
      'documents.created_by',
      'document_embeddings.chunk',
      'document_embeddings.summary',
    ])
    .orderBy('rank', 'desc')
    .limit(limit)
    .execute();

  console.log('Keyword search results count:', results.length);

  return results.map((result) => ({
    id: result.id,
    text: result.text,
    summary: result.summary,
    score: result.rank,
    type: 'keyword',
    createdAt: result.created_at,
    createdBy: result.created_by,
    chunkIndex: result.chunk_index,
    sourceType: 'document' as const,
  }));
};

const combineSearchResults = async (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[]
): Promise<AIDocument[]> => {
  if (!config.ai.enabled) {
    return [];
  }

  console.log('semanticResults', semanticResults);
  console.log('keywordResults', keywordResults);
  const { semanticSearchWeight, keywordSearchWeight } =
    config.ai.retrieval.hybridSearch;

  const authorIds = Array.from(
    new Set(
      [...semanticResults, ...keywordResults]
        .map((r) => r.createdBy)
        .filter((id): id is string => id !== undefined && id !== null)
    )
  );

  const authors =
    authorIds.length > 0
      ? await database
          .selectFrom('users')
          .select(['id', 'name'])
          .where('id', 'in', authorIds)
          .execute()
      : [];

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return combineAndScoreSearchResults(
    semanticResults,
    keywordResults,
    semanticSearchWeight,
    keywordSearchWeight,
    authorMap
  );
};
