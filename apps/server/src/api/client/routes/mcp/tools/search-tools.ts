import { UserStatus, extractNodeName } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { sql } from 'kysely';
import { authenticateMcpRequest, McpContext } from '../plugins/mcp-auth.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, context: McpContext) => Promise<any>;
}

export const searchTools: McpTool[] = [
  {
    name: 'search_content',
    description: 'Search for content across a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to search in'
        },
        query: {
          type: 'string',
          description: 'The search query'
        },
        type: {
          type: 'string',
          enum: ['page', 'space', 'database', 'message', 'all'],
          description: 'Type of content to search for (default: all)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)'
        }
      },
      required: ['workspace_id', 'query']
    },
    handler: async (args: { workspace_id: string; query: string; type?: string; limit?: number }, context: McpContext) => {
      const account = await authenticateMcpRequest(context);
      
      // Verify user access to workspace
      const user = await database
        .selectFrom('users')
        .selectAll()
        .where('workspace_id', '=', args.workspace_id)
        .where('account_id', '=', account.id)
        .where('status', '=', UserStatus.Active)
        .executeTakeFirst();

      if (!user) {
        throw new Error('Workspace not found or access denied');
      }

      if (!args.query?.trim()) {
        throw new Error('Search query is required');
      }

      const searchQuery = args.query.trim();
      const searchType = args.type || 'all';
      const limit = args.limit || 20;

      // Search in node attributes using proper JSON queries
      let nodeQuery = database
        .selectFrom('nodes')
        .select([
          'id',
          'type',
          'attributes',
          'parent_id',
          'root_id',
          'created_at',
          'created_by',
          'updated_at',
          'updated_by'
        ])
        .where('workspace_id', '=', args.workspace_id)
        .where(({ eb, fn }) => 
          eb.or([
            eb(fn.coalesce(sql`attributes::text`, sql`'{}'`), 'ilike', `%${searchQuery}%`)
          ])
        )
        .orderBy('created_at', 'desc')
        .limit(limit);

      if (searchType !== 'all') {
        nodeQuery = nodeQuery.where('type', '=', searchType as any);
      }

      const nodes = await nodeQuery.execute();

      // Search in document content
      const documentQuery = database
        .selectFrom('documents')
        .innerJoin('nodes', 'nodes.id', 'documents.id')
        .select([
          'nodes.id',
          'nodes.type',
          'nodes.attributes',
          'nodes.parent_id',
          'nodes.root_id',
          'nodes.created_at',
          'nodes.created_by',
          'documents.content'
        ])
        .where('nodes.workspace_id', '=', args.workspace_id)
        .where(({ eb, fn }) => 
          eb(fn.coalesce(sql`documents.content::text`, sql`'{}'`), 'ilike', `%${searchQuery}%`)
        )
        .orderBy('nodes.created_at', 'desc')
        .limit(limit);

      const documentsWithContent = await documentQuery.execute();

      // Combine and deduplicate results
      const allResults = [...nodes, ...documentsWithContent];
      const uniqueResults = allResults.reduce((acc, item) => {
        if (!acc.find(existing => existing.id === item.id)) {
          acc.push(item);
        }
        return acc;
      }, [] as typeof allResults);

      // Sort by relevance (name matches first, then content matches)
      const sortedResults = uniqueResults.sort((a, b) => {
        const aName = extractNodeName(a.attributes) || '';
        const bName = extractNodeName(b.attributes) || '';
        const aNameMatch = aName.toLowerCase().includes(searchQuery.toLowerCase());
        const bNameMatch = bName.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // If both or neither have name matches, sort by creation date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return {
        results: sortedResults.slice(0, limit).map(item => ({
          id: item.id,
          type: item.type,
          name: extractNodeName(item.attributes) || 'Untitled',
          parent_id: item.parent_id,
          root_id: item.root_id,
          created_at: item.created_at,
          created_by: item.created_by,
          updated_at: 'updated_at' in item ? item.updated_at : item.created_at,
          updated_by: 'updated_by' in item ? item.updated_by : item.created_by,
          content_preview: 'content' in item && item.content ? 
            JSON.stringify(item.content).substring(0, 200) + '...' : 
            undefined
        })),
        total: sortedResults.length,
        query: searchQuery,
        workspace_id: args.workspace_id
      };
    }
  },

  {
    name: 'node_children',
    description: 'Get child nodes of a specific node (space, page, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace'
        },
        parent_id: {
          type: 'string',
          description: 'The ID of the parent node'
        },
        type: {
          type: 'string',
          description: 'Filter by specific node type (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of children to return (default: 50)'
        }
      },
      required: ['workspace_id', 'parent_id']
    },
    handler: async (args: { workspace_id: string; parent_id: string; type?: string; limit?: number }, context: McpContext) => {
      const account = await authenticateMcpRequest(context);
      
      // Verify user access to workspace
      const user = await database
        .selectFrom('users')
        .selectAll()
        .where('workspace_id', '=', args.workspace_id)
        .where('account_id', '=', account.id)
        .where('status', '=', UserStatus.Active)
        .executeTakeFirst();

      if (!user) {
        throw new Error('Workspace not found or access denied');
      }

      // Verify parent node exists
      const parentNode = await database
        .selectFrom('nodes')
        .select(['id', 'type', 'attributes'])
        .where('id', '=', args.parent_id)
        .where('workspace_id', '=', args.workspace_id)
        .executeTakeFirst();

      if (!parentNode) {
        throw new Error('Parent node not found');
      }

      let query = database
        .selectFrom('nodes')
        .selectAll()
        .where('workspace_id', '=', args.workspace_id)
        .where('parent_id', '=', args.parent_id)
        .orderBy('created_at', 'desc')
        .limit(args.limit || 50);

      if (args.type) {
        query = query.where('type', '=', args.type as any);
      }

      const children = await query.execute();

      return {
        parent: {
          id: parentNode.id,
          type: parentNode.type,
          name: extractNodeName(parentNode.attributes) || 'Untitled'
        },
        children: children.map(child => ({
          id: child.id,
          type: child.type,
          name: extractNodeName(child.attributes) || 'Untitled',
          created_at: child.created_at,
          created_by: child.created_by,
          updated_at: child.updated_at,
          updated_by: child.updated_by
        })),
        total: children.length,
        workspace_id: args.workspace_id
      };
    }
  }
];