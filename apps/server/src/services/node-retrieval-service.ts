import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { sql } from 'kysely';

import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { SearchResult } from '@/types/retrieval';
import { RewrittenQuery } from '@/types/llm';
import { combineAndScoreSearchResults } from '@/lib/ai-utils';

export class NodeRetrievalService {
  private embeddings = new OpenAIEmbeddings({
    apiKey: configuration.ai.embedding.apiKey,
    modelName: configuration.ai.embedding.modelName,
    dimensions: configuration.ai.embedding.dimensions,
  });

  public async retrieve(
    rewrittenQuery: RewrittenQuery,
    workspaceId: string,
    userId: string,
    limit = configuration.ai.retrieval.hybridSearch.maxResults,
    contextNodeIds?: string[]
  ): Promise<Document[]> {
    const embedding = await this.embeddings.embedQuery(
      rewrittenQuery.semanticQuery
    );
    if (!embedding) {
      return [];
    }

    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(
        embedding,
        workspaceId,
        userId,
        limit,
        contextNodeIds
      ),
      this.keywordSearch(
        rewrittenQuery.keywordQuery,
        workspaceId,
        userId,
        limit,
        contextNodeIds
      ),
    ]);

    return this.combineSearchResults(semanticResults, keywordResults);
  }

  private async semanticSearch(
    embedding: number[],
    workspaceId: string,
    userId: string,
    limit: number,
    contextNodeIds?: string[]
  ): Promise<SearchResult[]> {
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
  }

  private async keywordSearch(
    query: string,
    workspaceId: string,
    userId: string,
    limit: number,
    contextNodeIds?: string[]
  ): Promise<SearchResult[]> {
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
  }

  private async combineSearchResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[]
  ): Promise<Document[]> {
    const { semanticSearchWeight, keywordSearchWeight } =
      configuration.ai.retrieval.hybridSearch;

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
  }
}

export const nodeRetrievalService = new NodeRetrievalService();
