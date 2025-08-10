import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createHybridSearchTool = () =>
  createTool({
    id: 'hybrid-search',
    description:
      'Perform hybrid (semantic + keyword) search on workspace documents and nodes',
    inputSchema: z.object({
      semanticQuery: z.string().describe('The semantic search query'),
      keywordQuery: z.string().describe('The keyword search query'),
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
          score: z.number().describe('Hybrid relevance score (0-1 scaled)'),
          metadata: z
            .record(z.any())
            .describe('Additional metadata about the source'),
        })
      ),
      totalFound: z.number().describe('Total number of results returned'),
      searchType: z.literal('hybrid').describe('Hybrid search'),
    }),
    execute: async ({ context }) => {
      const { retrieveNodes } = await import(
        '@colanode/server/lib/ai/node-retrievals'
      );
      const { retrieveDocuments } = await import(
        '@colanode/server/lib/ai/document-retrievals'
      );

      const {
        semanticQuery,
        keywordQuery,
        workspaceId,
        userId,
        maxResults = 10,
        selectedContextNodeIds = [],
      } = context;

      try {
        console.log(
          `🔎 Hybrid search for: semantic="${semanticQuery}" keyword="${keywordQuery}" (max: ${maxResults})`
        );

        // Perform hybrid retrieval per source type
        const [nodeResults, documentResults] = await Promise.all([
          retrieveNodes(
            {
              semanticQuery,
              keywordQuery,
              originalQuery: semanticQuery || keywordQuery,
              intent: 'retrieve',
            },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
          retrieveDocuments(
            {
              semanticQuery,
              keywordQuery,
              originalQuery: semanticQuery || keywordQuery,
              intent: 'retrieve',
            },
            workspaceId,
            userId,
            maxResults,
            selectedContextNodeIds
          ),
        ]);

        const allResults = [...nodeResults, ...documentResults].slice(
          0,
          maxResults
        );

        // Convert to standardized format (loosen typing for MDocument)
        const results = allResults.map((doc) => {
          const md = doc as any;
          return {
            content: md.pageContent || md.text || '',
            type: md.metadata?.type || 'document',
            sourceId: md.metadata?.id || md.id || '',
            score: md.metadata?.score || md.score || 0,
            metadata: md.metadata || {},
          };
        });

        console.log(`✅ Hybrid search returned ${results.length} results`);

        return {
          results,
          totalFound: results.length,
          searchType: 'hybrid' as const,
        };
      } catch (error) {
        console.error('❌ Hybrid search error:', error);
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
  hybridSearch: createHybridSearchTool(),

  databaseSchemaInspection: createDatabaseSchemaInspectionTool(),
  databaseQuery: createDatabaseQueryTool(),
});
