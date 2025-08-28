import { FastifyInstance } from 'fastify';
import { setupMcpServer } from './mcp-server.js';

export default async function mcpRoutes(fastify: FastifyInstance) {
  // Set up MCP server endpoint
  await fastify.register(setupMcpServer, {
    prefix: '/mcp'
  });
}