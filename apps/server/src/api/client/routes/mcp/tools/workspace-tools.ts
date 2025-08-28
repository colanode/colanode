import { UserStatus, WorkspaceStatus } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { createWorkspace } from '@colanode/server/lib/workspaces';
import { authenticateMcpRequest, McpContext } from '../plugins/mcp-auth.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, context: McpContext) => Promise<any>;
}

export const workspaceTools: McpTool[] = [
  {
    name: 'workspace_list',
    description: 'List all workspaces accessible to the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args: {}, context: McpContext) => {
      const account = await authenticateMcpRequest(context);
      
      const workspaces = await database
        .selectFrom('workspaces')
        .innerJoin('users', 'users.workspace_id', 'workspaces.id')
        .selectAll('workspaces')
        .select(['users.role', 'users.status as user_status'])
        .where('users.account_id', '=', account.id)
        .where('users.status', '=', UserStatus.Active)
        .where('workspaces.status', '=', WorkspaceStatus.Active)
        .execute();

      return {
        workspaces: workspaces.map(workspace => ({
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          avatar: workspace.avatar,
          role: workspace.role,
          status: workspace.status,
          created_at: workspace.created_at,
          storage_limit: workspace.storage_limit,
          max_file_size: workspace.max_file_size
        }))
      };
    }
  },

  {
    name: 'workspace_create',
    description: 'Create a new workspace',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the workspace'
        },
        description: {
          type: 'string',
          description: 'Optional description of the workspace'
        },
        avatar: {
          type: 'string',
          description: 'Optional avatar/icon for the workspace'
        }
      },
      required: ['name']
    },
    handler: async (args: { name: string; description?: string; avatar?: string }, context: McpContext) => {
      const account = await authenticateMcpRequest(context);
      
      if (!args.name?.trim()) {
        throw new Error('Workspace name is required');
      }

      // Get full account details for workspace creation
      const fullAccount = await database
        .selectFrom('accounts')
        .selectAll()
        .where('id', '=', account.id)
        .executeTakeFirst();

      if (!fullAccount) {
        throw new Error('Account not found');
      }

      const workspace = await createWorkspace(fullAccount, {
        name: args.name.trim(),
        description: args.description?.trim(),
        avatar: args.avatar?.trim()
      });

      return {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          avatar: workspace.avatar,
          user: workspace.user
        }
      };
    }
  },

  {
    name: 'workspace_get',
    description: 'Get details of a specific workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to retrieve'
        }
      },
      required: ['workspace_id']
    },
    handler: async (args: { workspace_id: string }, context: McpContext) => {
      const account = await authenticateMcpRequest(context);
      
      if (!args.workspace_id) {
        throw new Error('Workspace ID is required');
      }

      // Verify user has access to this workspace
      const userWorkspace = await database
        .selectFrom('workspaces')
        .innerJoin('users', 'users.workspace_id', 'workspaces.id')
        .selectAll('workspaces')
        .select(['users.role', 'users.status as user_status'])
        .where('workspaces.id', '=', args.workspace_id)
        .where('users.account_id', '=', account.id)
        .where('users.status', '=', UserStatus.Active)
        .executeTakeFirst();

      if (!userWorkspace) {
        throw new Error('Workspace not found or access denied');
      }

      // Get basic workspace stats (simplified without counter table)
      const [userCount, nodeCount] = await Promise.all([
        database
          .selectFrom('users')
          .select(({ fn }) => [fn.count<string>('id').as('count')])
          .where('workspace_id', '=', args.workspace_id)
          .where('status', '=', UserStatus.Active)
          .executeTakeFirst(),
        database
          .selectFrom('nodes')
          .select(({ fn }) => [fn.count<string>('id').as('count')])
          .where('workspace_id', '=', args.workspace_id)
          .executeTakeFirst()
      ]);

      return {
        workspace: {
          id: userWorkspace.id,
          name: userWorkspace.name,
          description: userWorkspace.description,
          avatar: userWorkspace.avatar,
          role: userWorkspace.role,
          status: userWorkspace.status,
          created_at: userWorkspace.created_at,
          storage_limit: userWorkspace.storage_limit,
          max_file_size: userWorkspace.max_file_size,
          stats: {
            users: parseInt(userCount?.count || '0'),
            nodes: parseInt(nodeCount?.count || '0'),
            storage_used: 0 // Would need to calculate from uploads
          }
        }
      };
    }
  }
];