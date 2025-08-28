import { generateId, IdType, UserStatus, extractNodeName } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { sql } from 'kysely';
import { createNode, fetchNode } from '@colanode/server/lib/nodes';
import { createDocument } from '@colanode/server/lib/documents';
import { authenticateMcpRequest, McpContext } from '../plugins/mcp-auth.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, context: McpContext) => Promise<any>;
}

export const contentTools: McpTool[] = [
  {
    name: 'page_create',
    description: 'Create a new page in a workspace or space',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace'
        },
        parent_id: {
          type: 'string',
          description: 'The ID of the parent space or page (optional, defaults to workspace root)'
        },
        name: {
          type: 'string',
          description: 'The name/title of the page'
        },
        content: {
          type: 'string',
          description: 'The initial content of the page (plain text format)'
        }
      },
      required: ['workspace_id', 'name']
    },
    handler: async (args: { workspace_id: string; parent_id?: string; name: string; content?: string }, context: McpContext) => {
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

      // Find parent (space or page) or use workspace root
      let parentId = args.parent_id;
      if (!parentId) {
        // Get the default space (Home space) in the workspace
        const homeSpace = await database
          .selectFrom('nodes')
          .select('id')
          .where('workspace_id', '=', args.workspace_id)
          .where('type', '=', 'space')
          .where(({ eb, fn }) => 
            eb(fn.coalesce(sql`attributes::text`, sql`'{}'`), 'ilike', '%"name":"Home"%')
          )
          .executeTakeFirst();
        
        if (homeSpace) {
          parentId = homeSpace.id;
        }
      }

      if (!parentId) {
        throw new Error('Parent space/page not found');
      }

      // Verify parent exists and user has access
      const parent = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', parentId)
        .where('workspace_id', '=', args.workspace_id)
        .executeTakeFirst();

      if (!parent) {
        throw new Error('Parent space/page not found');
      }

      const pageId = generateId(IdType.Page);
      
      // Create the page node
      const success = await createNode({
        nodeId: pageId,
        rootId: parent.root_id,
        attributes: {
          type: 'page',
          name: args.name,
          parentId: parentId,
        },
        userId: user.id,
        workspaceId: args.workspace_id,
      });

      if (!success) {
        throw new Error('Failed to create page');
      }

      // If content is provided, create the document with proper structure
      if (args.content) {
        const documentContent = {
          type: 'rich_text' as const,
          blocks: {
            'block1': {
              id: 'block1',
              type: 'paragraph',
              parentId: '',
              index: 'a0',
              content: [
                {
                  type: 'text',
                  text: args.content
                }
              ]
            }
          }
        };

        await createDocument({
          nodeId: pageId,
          content: documentContent,
          userId: user.id,
          workspaceId: args.workspace_id,
        });
      }

      // Fetch the created page
      const createdPage = await fetchNode(pageId);
      if (!createdPage) {
        throw new Error('Failed to retrieve created page');
      }

      return {
        page: {
          id: createdPage.id,
          name: extractNodeName(createdPage.attributes) || 'Untitled',
          parent_id: createdPage.parent_id,
          root_id: createdPage.root_id,
          created_at: createdPage.created_at,
          created_by: createdPage.created_by
        }
      };
    }
  },

  {
    name: 'page_list',
    description: 'List pages in a workspace or space',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace'
        },
        parent_id: {
          type: 'string',
          description: 'The ID of the parent space/page to list pages from (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of pages to return (default: 50)'
        }
      },
      required: ['workspace_id']
    },
    handler: async (args: { workspace_id: string; parent_id?: string; limit?: number }, context: McpContext) => {
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

      let query = database
        .selectFrom('nodes')
        .selectAll()
        .where('workspace_id', '=', args.workspace_id)
        .where('type', '=', 'page')
        .orderBy('created_at', 'desc')
        .limit(args.limit || 50);

      if (args.parent_id) {
        query = query.where('parent_id', '=', args.parent_id);
      }

      const pages = await query.execute();

      return {
        pages: pages.map(page => ({
          id: page.id,
          name: extractNodeName(page.attributes) || 'Untitled',
          parent_id: page.parent_id,
          root_id: page.root_id,
          created_at: page.created_at,
          created_by: page.created_by,
          updated_at: page.updated_at,
          updated_by: page.updated_by
        }))
      };
    }
  },

  {
    name: 'page_get',
    description: 'Get details and content of a specific page',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: {
          type: 'string',
          description: 'The ID of the page to retrieve'
        },
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace'
        }
      },
      required: ['page_id', 'workspace_id']
    },
    handler: async (args: { page_id: string; workspace_id: string }, context: McpContext) => {
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

      // Fetch the page
      const page = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', args.page_id)
        .where('workspace_id', '=', args.workspace_id)
        .where('type', '=', 'page')
        .executeTakeFirst();

      if (!page) {
        throw new Error('Page not found');
      }

      // Fetch document content if exists
      const document = await database
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', args.page_id) // documents table uses 'id' column
        .executeTakeFirst();

      let content = null;
      if (document) {
        content = document.content;
      }

      return {
        page: {
          id: page.id,
          name: extractNodeName(page.attributes) || 'Untitled',
          parent_id: page.parent_id,
          root_id: page.root_id,
          created_at: page.created_at,
          created_by: page.created_by,
          updated_at: page.updated_at,
          updated_by: page.updated_by,
          content: content
        }
      };
    }
  },

  {
    name: 'space_list',
    description: 'List spaces in a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace'
        }
      },
      required: ['workspace_id']
    },
    handler: async (args: { workspace_id: string }, context: McpContext) => {
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

      const spaces = await database
        .selectFrom('nodes')
        .selectAll()
        .where('workspace_id', '=', args.workspace_id)
        .where('type', '=', 'space')
        .orderBy('created_at', 'desc')
        .execute();

      return {
        spaces: spaces.map(space => ({
          id: space.id,
          name: extractNodeName(space.attributes) || 'Untitled',
          created_at: space.created_at,
          created_by: space.created_by
        }))
      };
    }
  }
];