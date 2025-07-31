/**
 * Main AI Assistant Configuration
 *
 * This file contains the primary AI assistant that users interact with.
 * It coordinates with tools and other agents to provide comprehensive responses,
 * with built-in memory for conversation context and user preferences.
 */

import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core';

import { ModelConfig } from './ai-models';
import { createAITools } from './ai-tools';
import {
  createQueryRewriteAgent,
  createIntentRecognitionAgent,
  createGeneralKnowledgeAgent,
} from './ai-agents';

/**
 * Main Workspace AI Assistant
 *
 * This is the primary assistant that users interact with. It can:
 * - Search through workspace documents and databases
 * - Provide contextual responses based on workspace data
 * - Handle both specific workspace queries and general knowledge questions
 * - Maintain conversation context and memory
 * - Remember user preferences and working contexts
 */
export const createWorkspaceAssistant = () => {
  const tools = createAITools();

  // TODO: Add memory configuration when @mastra/memory types are available
  // For now, creating a simple assistant without memory to avoid import issues

  return new Agent({
    name: 'Colanode Workspace Assistant',
    description:
      'AI assistant for Colanode workspace collaboration and knowledge management with conversation memory',
    instructions: ({ runtimeContext }) => {
      // Extract context information
      const workspaceName =
        runtimeContext?.get('workspaceName') || 'your workspace';
      const userName = runtimeContext?.get('userName') || 'there';
      const userEmail = runtimeContext?.get('userEmail') || '';
      const currentTimestamp = new Date().toISOString();

      return `You are an AI assistant for the Colanode collaboration workspace platform.

## Current Context
- **Time**: ${currentTimestamp}
- **Workspace**: ${workspaceName}
- **User**: ${userName}${userEmail ? ` (${userEmail})` : ''}

## Your Role
You help users by:
1. **Searching workspace content** - Use the document search tool to find relevant information
2. **Filtering database records** - Use the database filter tool for structured data queries
3. **Providing accurate responses** - Base answers on found information with proper citations
4. **Maintaining context** - Remember conversation history and user preferences

## Response Guidelines

### When to Use Tools
- **Document Search**: For any questions about workspace content, files, documents, or general information
- **Database Filter**: When users ask about specific records, data filtering, or structured information

### Response Quality
- **Always cite sources** when referencing specific information (use sourceId from search results)
- **Be specific and accurate** - Don't make up information not found in the search results
- **Acknowledge limitations** - If no relevant information is found, say so clearly
- **Stay contextual** - Consider the workspace and user context in your responses

### Citation Format
When referencing information from search results, mention the source:
- "According to [document name]..." 
- "Based on the information in [source]..."
- "The search results show..."

### Information Not Found
If search tools don't return relevant results:
- Clearly state that no relevant information was found in the workspace
- Suggest alternative search terms or approaches
- Offer to help with related topics or general knowledge

## Tool Usage
You have access to these tools:
- **workspace-document-search**: Search through all workspace documents and content
- **workspace-database-filter**: Filter and find specific database records

Use these tools proactively when users ask questions that might benefit from workspace-specific information.

Remember: You're here to help users get the most out of their workspace data and collaborate more effectively!`;
    },
    model: ({ runtimeContext }) => {
      // Allow dynamic model selection based on context
      const task = (runtimeContext?.get('task') as string) || 'response';
      return ModelConfig.forAssistant();
    },
    tools: {
      documentSearch: tools.documentSearch,
      databaseFilter: tools.databaseFilter,
    },
  });
};

/**
 * Initialize the complete Mastra AI system
 *
 * This creates all agents and configures the Mastra instance
 * with the full AI assistant capabilities including memory.
 */
export const initializeAISystem = () => {
  const workspaceAssistant = createWorkspaceAssistant();
  const queryRewriter = createQueryRewriteAgent();
  const intentClassifier = createIntentRecognitionAgent();
  const generalKnowledge = createGeneralKnowledgeAgent();

  const mastra = new Mastra({
    agents: {
      // Primary assistant that users interact with
      assistant: workspaceAssistant,

      // Specialized agents for specific tasks
      queryRewriter,
      intentClassifier,
      generalKnowledge,
    },
  });

  return {
    mastra,
    agents: {
      assistant: workspaceAssistant,
      queryRewriter,
      intentClassifier,
      generalKnowledge,
    },
  };
};

/**
 * Get the main workspace assistant
 *
 * Convenience function to get just the primary assistant agent
 * without initializing the full system.
 */
export const getWorkspaceAssistant = () => {
  return createWorkspaceAssistant();
};

/**
 * Assistant configuration constants
 */
export const AssistantConfig = {
  NAME: 'Colanode Workspace Assistant',
  DESCRIPTION:
    'AI assistant for workspace collaboration and knowledge management',
  MAX_STEPS: 3, // Default maximum tool usage steps
  DEFAULT_CONTEXT_WINDOW: 10, // Default number of previous messages to consider
} as const;
