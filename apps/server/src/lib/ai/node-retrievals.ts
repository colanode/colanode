import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { sql } from 'kysely';

import { database } from '@/data/database';
import { config } from '@/lib/config';
import { SearchResult } from '@/types/retrieval';
import { RewrittenQuery } from '@/types/llm';
import { combineAndScoreSearchResults } from '@/lib/ai/utils';

const embeddings = config.ai.enabled
  ? new OpenAIEmbeddings({
      apiKey: config.ai.embedding.apiKey,
      modelName: config.ai.embedding.modelName,
      dimensions: config.ai.embedding.dimensions,
    })
  : undefined;

export const retrieveNodes = async (
  rewrittenQuery: RewrittenQuery,
  workspaceId: string,
  userId: string,
  limit?: number,
  contextNodeIds?: string[]
): Promise<Document[]> => {
  if (!config.ai.enabled || !embeddings) {
    return [];
  }

  const maxResults = limit ?? config.ai.retrieval.hybridSearch.maxResults;
  const embedding = await embeddings.embedQuery(rewrittenQuery.semanticQuery);

  if (!embedding) {
    return [];
  }

  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearchNodes(
      embedding,
      workspaceId,
      userId,
      maxResults,
      contextNodeIds
    ),
    keywordSearchNodes(
      rewrittenQuery.keywordQuery,
      workspaceId,
      userId,
      maxResults,
      contextNodeIds
    ),
  ]);

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
      sql<number>`${sql.raw(`'[${embedding}]'::vector`)} <=> node_embeddings.embedding_vector`.as(
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
    .groupBy([
      'node_embeddings.node_id',
      'node_embeddings.text',
      'nodes.created_at',
      'nodes.created_by',
      'node_embeddings.chunk',
      'node_embeddings.summary',
    ])
    .orderBy('similarity', 'asc')
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
  }));
};

const combineSearchResults = async (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[]
): Promise<Document[]> => {
  if (!config.ai.enabled || !embeddings) {
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
