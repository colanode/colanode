import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  Tool, 
  CallToolResult 
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { workspaceTools } from './tools/workspace-tools.js';
import { contentTools } from './tools/content-tools.js';
import { searchTools } from './tools/search-tools.js';

// Combine all tools
const allTools = [
  ...workspaceTools,
  ...contentTools,
  ...searchTools
];

export async function setupMcpServer(fastify: FastifyInstance) {
  // Create MCP server instance
  const server = new Server({
    name: 'colanode-mcp-server',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools.map((tool): Tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    
    // Find the tool handler
    const tool = allTools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    try {
      // Create context for the tool handler without httpRequest
      const context = {
        fastify,
        extra
      };
      
      // Execute the tool with the provided arguments
      const result = await tool.handler(args, context);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true
      };
    }
  });

  // Handle MCP requests via HTTP POST
  fastify.post('/request', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Add HTTP request to extra context for tools
      const requestWithExtra = {
        ...request.body as any,
        extra: {
          httpRequest: request
        }
      };
      
      // This method doesn't exist, need to handle requests manually
      // For now, let's implement basic request routing
      const body = request.body as any;
      
      if (body.method === 'tools/list') {
        const response = await server.request({ method: 'tools/list', params: {} }, null as any);
        reply.send(response);
      } else if (body.method === 'tools/call') {
        const response = await server.request({ method: 'tools/call', params: body.params }, null as any);
        reply.send(response);
      } else {
        reply.code(400).send({ error: 'Unsupported method' });
      }
    } catch (error) {
      reply.code(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'healthy', tools: allTools.length };
  });

  // List available tools endpoint
  fastify.get('/tools', async () => {
    return {
      tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });
}