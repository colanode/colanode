import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createSemanticSearchTool = () =>
  createTool({
    id: 'semantic-search',
    description:
      'Perform pure semantic/vector search on workspace documents and nodes',
    inputSchema: z.object({
      query: z.string().describe('The semantic search query'),
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
          score: z.number().describe('Semantic similarity score (0-1)'),
          metadata: z
            .record(z.any())
            .describe('Additional metadata about the source'),
        })
      ),
      totalFound: z.number().describe('Total number of results found'),
      searchType: z
        .literal('semantic')
        .describe('Always semantic for this tool'),
    }),
    execute: async ({ context }) => {
      const { retrieveNodes } = await import(
        '@colanode/server/lib/ai/node-retrievals'
      );
      const { retrieveDocuments } = await import(
        '@colanode/server/lib/ai/document-retrievals'
      );

      const {
        query,
        workspaceId,
        userId,
        maxResults = 10,
        selectedContextNodeIds = [],
      } = context;

      try {
        console.log(`🔍 Semantic search for: "${query}" (max: ${maxResults})`);

        // Perform semantic search only (no keyword search)
        const [nodeResults, documentResults] = await Promise.all([
          retrieveNodes(
            { semanticQuery: query, keywordQuery: '' }, // Empty keywordQuery for pure semantic
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
          retrieveDocuments(
            { semanticQuery: query, keywordQuery: '' },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
        ]);

        const allResults = [...nodeResults, ...documentResults]
          .sort((a, b) => (b.metadata.score || 0) - (a.metadata.score || 0)) // Sort by semantic score
          .slice(0, maxResults);

        // Convert to standardized format
        const results = allResults.map((doc) => ({
          content: doc.pageContent || '',
          type: doc.metadata.type || 'document',
          sourceId: doc.metadata.id || '',
          score: doc.metadata.score || 0,
          metadata: doc.metadata || {},
        }));

        console.log(`✅ Semantic search found ${results.length} results`);

        return {
          results,
          totalFound: allResults.length,
          searchType: 'semantic' as const,
        };
      } catch (error) {
        console.error('❌ Semantic search error:', error);
        throw error;
      }
    },
  });

export const createKeywordSearchTool = () =>
  createTool({
    id: 'keyword-search',
    description:
      'Perform pure keyword/full-text search on workspace documents and nodes',
    inputSchema: z.object({
      query: z.string().describe('The keyword search query'),
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
          score: z.number().describe('Keyword relevance score (0-1)'),
          metadata: z
            .record(z.any())
            .describe('Additional metadata about the source'),
        })
      ),
      totalFound: z.number().describe('Total number of results found'),
      searchType: z.literal('keyword').describe('Always keyword for this tool'),
    }),
    execute: async ({ context }) => {
      const { retrieveNodes } = await import(
        '@colanode/server/lib/ai/node-retrievals'
      );
      const { retrieveDocuments } = await import(
        '@colanode/server/lib/ai/document-retrievals'
      );

      const {
        query,
        workspaceId,
        userId,
        maxResults = 10,
        selectedContextNodeIds = [],
      } = context;

      try {
        console.log(`🔤 Keyword search for: "${query}" (max: ${maxResults})`);

        // Perform keyword search only (no semantic search)
        const [nodeResults, documentResults] = await Promise.all([
          retrieveNodes(
            { semanticQuery: '', keywordQuery: query }, // Empty semanticQuery for pure keyword
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
          retrieveDocuments(
            { semanticQuery: '', keywordQuery: query },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
        ]);

        const allResults = [...nodeResults, ...documentResults]
          .sort((a, b) => (b.metadata.score || 0) - (a.metadata.score || 0)) // Sort by keyword score
          .slice(0, maxResults);

        // Convert to standardized format
        const results = allResults.map((doc) => ({
          content: doc.pageContent || '',
          type: doc.metadata.type || 'document',
          sourceId: doc.metadata.id || '',
          score: doc.metadata.score || 0,
          metadata: doc.metadata || {},
        }));

        console.log(`✅ Keyword search found ${results.length} results`);

        return {
          results,
          totalFound: allResults.length,
          searchType: 'keyword' as const,
        };
      } catch (error) {
        console.error('❌ Keyword search error:', error);
        throw error;
      }
    },
  });

export const createDatabaseSchemaInspectionTool = () =>
  createTool({
    id: 'database-schema-inspection',
    description: 'Get database schemas and structure for a workspace',
    inputSchema: z.object({
      workspaceId: z.string().describe('The workspace ID'),
      userId: z.string().describe('The user ID for access control'),
    }),
    outputSchema: z.object({
      databases: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          fields: z.record(
            z.object({
              type: z.string(),
              name: z.string(),
            })
          ),
          sampleRecords: z
            .array(z.any())
            .describe('Sample records for context'),
        })
      ),
      totalDatabases: z.number(),
    }),
    execute: async ({ context }) => {
      const { retrieveByFilters } = await import(
        '@colanode/server/lib/records'
      );
      const { database } = await import('@colanode/server/data/database');

      const { workspaceId, userId } = context;

      try {
        console.log(
          `🗄️ Inspecting database schemas for workspace: ${workspaceId}`
        );

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
            databases: [],
            totalDatabases: 0,
          };
        }

        console.log(`🔍 Found ${databases.length} accessible databases`);

        // Get database schemas and sample data
        const databaseSchemas = await Promise.all(
          databases.map(async (db: any) => {
            const sampleRecords = await retrieveByFilters(
              db.id,
              workspaceId,
              userId,
              { filters: [], sorts: [], page: 1, count: 3 } // Just 3 samples
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

            return {
              id: db.id,
              name: dbAttrs.name || 'Untitled Database',
              fields: formattedFields,
              sampleRecords,
            };
          })
        );

        console.log(
          `✅ Retrieved schemas for ${databaseSchemas.length} databases`
        );

        return {
          databases: databaseSchemas,
          totalDatabases: databaseSchemas.length,
        };
      } catch (error) {
        console.error('❌ Database schema inspection error:', error);
        throw error;
      }
    },
  });

export const createDatabaseQueryTool = () =>
  createTool({
    id: 'database-query',
    description: 'Execute structured queries against workspace databases',
    inputSchema: z.object({
      databaseId: z.string().describe('The database ID to query'),
      workspaceId: z.string().describe('The workspace ID'),
      userId: z.string().describe('The user ID for access control'),
      filters: z.array(z.any()).describe('Structured filter conditions'),
      maxResults: z.number().default(10).describe('Maximum number of results'),
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
      totalFound: z.number(),
      databaseName: z.string(),
    }),
    execute: async ({ context }) => {
      const { retrieveByFilters } = await import(
        '@colanode/server/lib/records'
      );
      const { fetchNode } = await import('@colanode/server/lib/nodes');

      const {
        databaseId,
        workspaceId,
        userId,
        filters,
        maxResults = 10,
      } = context;

      try {
        console.log(
          `🗄️ Querying database ${databaseId} with ${filters.length} filters`
        );

        // Get the database node for metadata
        const dbNode = await fetchNode(databaseId);
        if (!dbNode || dbNode.type !== 'database') {
          console.log('❌ Database not found or not accessible');
          return {
            results: [],
            totalFound: 0,
            databaseName: 'Unknown Database',
          };
        }

        const databaseName =
          (dbNode.attributes as any).name || 'Untitled Database';

        // Execute the query
        const records = await retrieveByFilters(
          databaseId,
          workspaceId,
          userId,
          { filters, sorts: [], page: 1, count: maxResults }
        );

        // Format results
        const results = records.map((record: any) => {
          const fields = Object.entries((record.attributes as any).fields || {})
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          const content = `Database Record from ${databaseName}:\n${fields}`;

          return {
            content,
            metadata: {
              id: record.id,
              type: 'record' as const,
              databaseId,
              databaseName,
              createdAt: record.created_at,
              createdBy: record.created_by,
            },
          };
        });

        console.log(
          `✅ Database query returned ${results.length} records from ${databaseName}`
        );

        return {
          results,
          totalFound: results.length,
          databaseName,
        };
      } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }
    },
  });

export const createAITools = () => ({
  semanticSearch: createSemanticSearchTool(),
  keywordSearch: createKeywordSearchTool(),

  databaseSchemaInspection: createDatabaseSchemaInspectionTool(),
  databaseQuery: createDatabaseQueryTool(),
});
