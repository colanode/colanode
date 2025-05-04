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

export const retrieveDocuments = async (
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
    semanticSearchDocuments(
      embedding,
      workspaceId,
      userId,
      maxResults,
      contextNodeIds
    ),
    keywordSearchDocuments(
      rewrittenQuery.keywordQuery,
      workspaceId,
      userId,
      maxResults,
      contextNodeIds
    ),
  ]);

  return combineSearchResults(semanticResults, keywordResults);
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
      sql<number>`${sql.raw(`'[${embedding}]'::vector`)} <=> document_embeddings.embedding_vector`.as(
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
    .groupBy([
      'document_embeddings.document_id',
      'document_embeddings.text',
      'document_embeddings.summary',
      'documents.created_at',
      'documents.created_by',
      'document_embeddings.chunk',
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

const keywordSearchDocuments = async (
  query: string,
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
