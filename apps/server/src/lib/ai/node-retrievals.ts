import { AIDocument } from '@colanode/server/lib/ai/utils';
import { embed } from 'ai';
import { sql } from 'kysely';

import { database } from '@colanode/server/data/database';
import { combineAndScoreSearchResults } from '@colanode/server/lib/ai/utils';
import { config } from '@colanode/server/lib/config';
import { getEmbeddingModel } from '@colanode/server/lib/ai/ai-models';
import { QueryRewriteOutput } from '@colanode/server/types/ai';
import { SearchResult } from '@colanode/server/types/retrieval';

export const retrieveNodes = async (
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

  const doSemantic = (rewrittenQuery.semanticQuery || '').trim().length > 0;
  const doKeyword = (rewrittenQuery.keywordQuery || '').trim().length > 0;

  let semanticResults: SearchResult[] = [];
  if (doSemantic) {
    const embeddingModel = getEmbeddingModel();
    const { embedding } = await embed({
      model: embeddingModel,
      value: rewrittenQuery.semanticQuery,
      providerOptions: {
        openai: {
          dimensions: config.ai.embedding.dimensions,
        },
      },
    });
    if (embedding) {
      semanticResults = await semanticSearchNodes(
        embedding,
        workspaceId,
        userId,
        maxResults,
        contextNodeIds
      );
    }
  }

  const keywordResults: SearchResult[] = doKeyword
    ? await keywordSearchNodes(
        rewrittenQuery.keywordQuery,
        workspaceId,
        userId,
        maxResults,
        contextNodeIds
      )
    : [];

  return combineSearchResults(semanticResults, keywordResults);
};

const semanticSearchNodes = async (
  embedding: number[],
  workspaceId: string,
  userId: string,
  limit: number,
  contextNodeIds?: string[]
): Promise<SearchResult[]> => {
  let queryBuilder = database
    .selectFrom('node_embeddings')
    .innerJoin('nodes', 'nodes.id', 'node_embeddings.node_id')
    .innerJoin('collaborations', (join) =>
      join
        .onRef('collaborations.node_id', '=', 'nodes.root_id')
        .on('collaborations.collaborator_id', '=', sql.lit(userId))
        .on('collaborations.deleted_at', 'is', null)
    )
    .select([
      'node_embeddings.node_id as id',
      'node_embeddings.text',
      'node_embeddings.summary',
      'nodes.created_at',
      'nodes.created_by',
      'node_embeddings.chunk as chunk_index',
      sql<number>`1 - (${sql.raw(`'[${embedding}]'::vector`)} <=> node_embeddings.embedding_vector)`.as(
        'similarity'
      ),
    ])
    .where('node_embeddings.workspace_id', '=', workspaceId);

  if (contextNodeIds && contextNodeIds.length > 0) {
    queryBuilder = queryBuilder.where(
      'node_embeddings.node_id',
      'in',
      contextNodeIds
    );
  }

  const results = await queryBuilder
    .distinctOn(['node_embeddings.node_id', 'node_embeddings.chunk'])
    .orderBy('node_embeddings.node_id')
    .orderBy('node_embeddings.chunk')
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
    sourceType: 'node' as const,
  }));
};

const keywordSearchNodes = async (
  query: string,
  workspaceId: string,
  userId: string,
  limit: number,
  contextNodeIds?: string[]
): Promise<SearchResult[]> => {
  let queryBuilder = database
    .selectFrom('node_embeddings')
    .innerJoin('nodes', 'nodes.id', 'node_embeddings.node_id')
    .innerJoin('collaborations', (join) =>
      join
        .onRef('collaborations.node_id', '=', 'nodes.root_id')
        .on('collaborations.collaborator_id', '=', sql.lit(userId))
        .on('collaborations.deleted_at', 'is', null)
    )
    .select([
      'node_embeddings.node_id as id',
      'node_embeddings.text',
      'node_embeddings.summary',
      'nodes.created_at',
      'nodes.created_by',
      'node_embeddings.chunk as chunk_index',
      sql<number>`ts_rank(node_embeddings.search_vector, websearch_to_tsquery('english', ${query}))`.as(
        'rank'
      ),
    ])
    .where('node_embeddings.workspace_id', '=', workspaceId)
    .where(
      () =>
        sql`node_embeddings.search_vector @@ websearch_to_tsquery('english', ${query})`
    );

  if (contextNodeIds && contextNodeIds.length > 0) {
    queryBuilder = queryBuilder.where(
      'node_embeddings.node_id',
      'in',
      contextNodeIds
    );
  }

  const results = await queryBuilder
    .groupBy([
      'node_embeddings.node_id',
      'node_embeddings.text',
      'nodes.created_at',
      'nodes.created_by',
      'node_embeddings.chunk',
      'node_embeddings.summary',
    ])
    .orderBy('rank', 'desc')
    .limit(limit)
    .execute();

  return results.map((result) => ({
    id: result.id,
    text: result.text,
    summary: result.summary,
    score: result.rank,
    type: 'keyword',
    createdAt: result.created_at,
    createdBy: result.created_by,
    chunkIndex: result.chunk_index,
    sourceType: 'node' as const,
  }));
};

const combineSearchResults = async (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[]
): Promise<AIDocument[]> => {
  if (!config.ai.enabled) {
    return [];
  }

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
