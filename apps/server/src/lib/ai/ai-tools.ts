/**
 * AI Tools for Workspace Operations
 *
 * This file contains all the tools that the AI assistant can use to interact
 * with workspace data, including enhanced document search with reranking
 * and advanced database filtering with optimized configurations.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Enhanced Document Search Tool
 *
 * Advanced workspace document search with semantic and keyword search,
 * automatic reranking, and quality filtering for optimal results.
 */
export const createDocumentSearchTool = () =>
  createTool({
    id: 'workspace-document-search',
    description:
      'Search through workspace documents and nodes to find relevant information using advanced semantic search with reranking',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      semanticQuery: z
        .string()
        .optional()
        .describe('Optimized semantic search query'),
      keywordQuery: z
        .string()
        .optional()
        .describe('Optimized keyword search query'),
      workspaceId: z.string().describe('The workspace ID to search in'),
      userId: z.string().describe('The user ID for access control'),
      maxResults: z
        .number()
        .default(10)
        .describe('Maximum number of results to return'),
      selectedContextNodeIds: z
        .array(z.string())
        .optional()
        .describe('Specific node IDs to search within'),
      enableReranking: z
        .boolean()
        .default(true)
        .describe('Whether to use advanced reranking for better results'),
      minScore: z
        .number()
        .optional()
        .describe('Minimum relevance score threshold (0-1)'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z
            .string()
            .describe('The content of the found document/node'),
          type: z
            .string()
            .describe('The type of content (document, node, etc.)'),
          sourceId: z.string().describe('Unique identifier for the source'),
          score: z.number().describe('Relevance score (0-1)'),
          metadata: z
            .record(z.any())
            .describe('Additional metadata about the source'),
        })
      ),
      totalFound: z.number().describe('Total number of results found'),
      searchType: z
        .enum(['semantic', 'keyword', 'hybrid'])
        .describe('Type of search performed'),
    }),
    execute: async ({ context }) => {
      // Import the existing retrieval functions
      const { retrieveNodes } = await import(
        '@colanode/server/lib/ai/node-retrievals'
      );
      const { retrieveDocuments } = await import(
        '@colanode/server/lib/ai/document-retrievals'
      );
      const { rerankDocuments } = await import('@colanode/server/lib/ai/llms');

      const {
        query,
        semanticQuery = query,
        keywordQuery = query,
        workspaceId,
        userId,
        maxResults,
        selectedContextNodeIds = [],
        enableReranking = true,
        minScore,
      } = context;

      try {
        console.log(`🔍 Searching workspace documents for: "${query}"`);

        // Perform parallel search across nodes and documents
        const [nodeResults, documentResults] = await Promise.all([
          retrieveNodes(
            { semanticQuery, keywordQuery },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
          retrieveDocuments(
            { semanticQuery, keywordQuery },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
        ]);

        const allResults = [...nodeResults, ...documentResults];

        if (allResults.length === 0) {
          console.log('📭 No documents found matching the search criteria');
          return {
            results: [],
            totalFound: 0,
            searchType: 'hybrid' as const,
          };
        }

        console.log(
          `📄 Found ${allResults.length} initial results, reranking for relevance...`
        );

        let finalResults = allResults;

        // Apply reranking if enabled
        if (enableReranking) {
          const docsForRerank = allResults.map((doc) => ({
            content: doc.pageContent,
            type: doc.metadata.type,
            sourceId: doc.metadata.id,
          }));

          const rerankedContext = await rerankDocuments(
            docsForRerank,
            semanticQuery
          );

          finalResults = rerankedContext
            .map((item) => {
              const originalDoc = allResults.find(
                (doc) => doc.metadata.id === item.sourceId
              );
              return originalDoc;
            })
            .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
        }

        // Convert to standardized output format with optional score filtering
        const results = finalResults
          .map((doc) => ({
            content: doc.pageContent || '',
            type: doc.metadata.type || 'document',
            sourceId: doc.metadata.id || '',
            score: doc.metadata.score || 0,
            metadata: doc.metadata || {},
          }))
          .filter((result) => {
            // Apply minimum score threshold if specified
            return minScore ? result.score >= minScore : true;
          })
          .slice(0, maxResults); // Ensure we don't exceed max results

        console.log(`✅ Returning ${results.length} reranked results`);

        return {
          results,
          totalFound: allResults.length,
          searchType: 'hybrid' as const,
        };
      } catch (error) {
        console.error('❌ Document search error:', error);
        return {
          results: [],
          totalFound: 0,
          searchType: 'hybrid' as const,
        };
      }
    },
  });

/**
 * Database Filter Tool
 *
 * Filters database records based on natural language queries by generating
 * appropriate filter conditions and executing them.
 */
export const createDatabaseFilterTool = () =>
  createTool({
    id: 'workspace-database-filter',
    description: 'Filter database records based on natural language queries',
    inputSchema: z.object({
      query: z.string().describe('The natural language query'),
      workspaceId: z.string().describe('The workspace ID'),
      userId: z.string().describe('The user ID for access control'),
      maxResults: z
        .number()
        .default(10)
        .describe('Maximum number of records to return'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          content: z
            .string()
            .describe('Formatted content of the database record'),
          metadata: z.object({
            id: z.string(),
            type: z.literal('record'),
            databaseId: z.string(),
            databaseName: z.string(),
            createdAt: z.date(),
            createdBy: z.string(),
          }),
        })
      ),
      databasesSearched: z
        .array(z.string())
        .describe('Names of databases that were searched'),
      filtersApplied: z
        .boolean()
        .describe('Whether any filters were successfully applied'),
    }),
    execute: async ({ context }) => {
      const { generateDatabaseFilters } = await import(
        '@colanode/server/lib/ai/llms'
      );
      const { retrieveByFilters } = await import(
        '@colanode/server/lib/records'
      );
      const { fetchNode } = await import('@colanode/server/lib/nodes');
      const { database } = await import('@colanode/server/data/database');

      const { query, workspaceId, userId, maxResults } = context;

      try {
        console.log(`🗄️ Filtering database records for: "${query}"`);

        // Get available databases for the user
        const databases = await database
          .selectFrom('nodes as n')
          .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
          .where('n.type', '=', 'database')
          .where('n.workspace_id', '=', workspaceId)
          .where('c.collaborator_id', '=', userId)
          .where('c.deleted_at', 'is', null)
          .selectAll()
          .execute();

        if (databases.length === 0) {
          console.log('📭 No accessible databases found');
          return {
            results: [],
            databasesSearched: [],
            filtersApplied: false,
          };
        }

        console.log(`🔍 Found ${databases.length} accessible databases`);

        // Prepare database context for AI filtering
        const databaseContext = await Promise.all(
          databases.map(async (db: any) => {
            const sampleRecords = await retrieveByFilters(
              db.id,
              workspaceId,
              userId,
              { filters: [], sorts: [], page: 1, count: 5 }
            );

            const dbAttrs = db.attributes as any;
            const fields = dbAttrs.fields || {};
            const formattedFields = Object.entries(fields).reduce(
              (acc: any, [id, field]: [string, any]) => ({
                ...acc,
                [id]: {
                  type: field.type,
                  name: field.name,
                },
              }),
              {}
            );

            // Convert sample records to expected format
            const convertedSampleRecords = sampleRecords.map((record: any) => ({
              id: record.id,
              type: record.type,
              parentId: record.parent_id,
              rootId: record.root_id,
              createdAt: record.created_at,
              createdBy: record.created_by,
              updatedAt: record.updated_at,
              updatedBy: record.updated_by,
              attributes: record.attributes,
            }));

            return {
              id: db.id,
              name: dbAttrs.name || 'Untitled Database',
              fields: formattedFields,
              sampleRecords: convertedSampleRecords,
            };
          })
        );

        // Generate AI-powered filters
        const filterResult = await generateDatabaseFilters({
          query,
          databases: databaseContext,
        });

        if (!filterResult.shouldFilter) {
          console.log(
            '🤖 AI determined no database filtering is needed for this query'
          );
          return {
            results: [],
            databasesSearched: databaseContext.map((db) => db.name),
            filtersApplied: false,
          };
        }

        console.log(
          `🎯 AI generated filters for ${filterResult.filters.length} databases`
        );

        // Execute filters and collect results
        const allResults = [];
        const searchedDatabases = [];

        for (const filter of filterResult.filters) {
          const dbContext = databaseContext.find(
            (db) => db.id === filter.databaseId
          );
          if (!dbContext) continue;

          searchedDatabases.push(dbContext.name);

          const records = await retrieveByFilters(
            filter.databaseId,
            workspaceId,
            userId,
            { filters: filter.filters, sorts: [], page: 1, count: maxResults }
          );

          const dbNode = await fetchNode(filter.databaseId);
          if (!dbNode || dbNode.type !== 'database') continue;

          for (const record of records) {
            const fields = Object.entries(
              (record.attributes as any).fields || {}
            )
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');

            const content = `Database Record from ${(dbNode.attributes as any).name || 'Database'}:\n${fields}`;

            allResults.push({
              content,
              metadata: {
                id: record.id,
                type: 'record' as const,
                databaseId: filter.databaseId,
                databaseName: dbContext.name,
                createdAt: record.created_at,
                createdBy: record.created_by,
              },
            });
          }
        }

        console.log(`✅ Found ${allResults.length} matching database records`);

        return {
          results: allResults,
          databasesSearched: searchedDatabases,
          filtersApplied: true,
        };
      } catch (error) {
        console.error('❌ Database filter error:', error);
        return {
          results: [],
          databasesSearched: [],
          filtersApplied: false,
        };
      }
    },
  });

/**
 * Export all available AI tools
 */
export const createAITools = () => ({
  documentSearch: createDocumentSearchTool(),
  databaseFilter: createDatabaseFilterTool(),
});

/**
 * Tool configuration for easy access
 */
export const AIToolsConfig = {
  DOCUMENT_SEARCH: 'workspace-document-search',
  DATABASE_FILTER: 'workspace-database-filter',
} as const;
