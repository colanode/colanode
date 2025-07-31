/**
 * AI Agents Configuration
 *
 * This file contains all AI agent definitions used in the assistant system.
 * Each agent has a specific role and capability set.
 */

import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import { ModelConfig } from './ai-models';

/**
 * Query Rewrite Agent
 *
 * Optimizes user queries for better search results by generating
 * both semantic and keyword-optimized versions using structured output.
 */
export const createQueryRewriteAgent = () =>
  new Agent({
    name: 'Query Optimizer',
    description: 'Optimizes search queries for better document retrieval',
    instructions: `You are an expert at rewriting search queries to optimize for both semantic similarity and keyword-based search.

Your task is to generate two separate optimized queries:
1. A semantic search query optimized for vector embeddings and semantic similarity
2. A keyword search query optimized for full-text search

For semantic search query:
- Focus on conceptual meaning and intent
- Include context-indicating terms
- Preserve relationship words between concepts
- Expand concepts with related terms
- Remove noise words and syntax-specific terms

For keyword search query:
- Focus on specific technical terms and exact matches
- Include variations of key terms
- Keep proper nouns and domain-specific vocabulary
- Optimize for PostgreSQL's websearch_to_tsquery syntax
- Include essential filters and constraints`,
    model: ModelConfig.forQueryRewrite(),
  });

/**
 * Intent Recognition Agent
 *
 * Determines whether a user query requires retrieving context from the
 * workspace knowledge base or can be answered with general knowledge.
 * Uses structured output for consistent classification.
 */
export const createIntentRecognitionAgent = () =>
  new Agent({
    name: 'Intent Classifier',
    description: 'Determines if a query requires workspace context retrieval',
    instructions: `Determine if the user query requires retrieving context from the workspace's knowledge base.

You are a crucial decision point that must decide between:
1. Retrieving and using specific context from the workspace ("retrieve")
2. Answering directly from general knowledge ("no_context")

Return "retrieve" when the query:
- Asks about specific workspace content, documents, or data
- References previous conversations or shared content
- Mentions specific projects, tasks, or workspace items
- Requires up-to-date information from the workspace
- Contains temporal references to workspace activity
- Asks about specific people or collaborators
- Needs details about database records or fields

Return "no_context" when the query:
- Asks for general knowledge or common facts
- Requests simple calculations or conversions
- Asks about general concepts without workspace specifics
- Makes small talk
- Requests explanations of universal concepts
- Can be answered correctly without workspace-specific information

Examples of "retrieve" queries:
- "What did John say about the API design yesterday?"
- "Show me the latest documentation about user authentication"
- "Find records in the Projects database where status is completed"
- "What were the key points from our last meeting?"

Examples of "no_context" queries:
- "What is REST API?"
- "How do I write a good commit message?"
- "Convert 42 kilometers to miles"
- "What's your name?"
- "Explain what is Docker in simple terms"`,
    model: ModelConfig.forIntentRecognition(),
  });

/**
 * General Knowledge Agent
 *
 * Handles queries that don't require workspace-specific context.
 * Uses general knowledge to provide helpful responses.
 */
export const createGeneralKnowledgeAgent = () =>
  new Agent({
    name: 'General Knowledge Assistant',
    description: "Handles queries that don't require workspace context",
    instructions: `You are a helpful assistant that answers queries using general knowledge.

Your role is to:
- Provide accurate, helpful information based on your training data
- Be concise but thorough in your responses
- Explain concepts clearly and simply
- Admit when you don't know something
- Suggest where users might find more specific information if needed

You should NOT:
- Try to access or reference workspace-specific information
- Make up facts or provide uncertain information as fact
- Provide outdated information when you know it might have changed

Always be helpful, accurate, and honest in your responses.`,
    model: ModelConfig.forGeneralKnowledge(),
  });

/**
 * Helper function to assess user intent using the intent recognition agent
 * Now with structured output for reliability
 *
 * @param query - User's query
 * @param chatHistory - Previous conversation context
 * @returns Promise resolving to intent classification
 */
export const assessUserIntent = async (
  query: string,
  chatHistory: string = ''
): Promise<'retrieve' | 'no_context'> => {
  const intentAgent = createIntentRecognitionAgent();

  const prompt = chatHistory
    ? `Chat History: ${chatHistory}\n\nUser Query: ${query}`
    : `User Query: ${query}`;

  const result = await intentAgent.generate(
    [{ role: 'user', content: prompt }],
    {
      output: z.object({
        intent: z
          .enum(['retrieve', 'no_context'])
          .describe(
            'Whether to retrieve from workspace or use general knowledge'
          ),
      }),
    }
  );

  return result.object?.intent || 'retrieve'; // Default to retrieve if uncertain
};

/**
 * Helper function to rewrite queries for better search using the query rewrite agent
 * Uses structured output for consistent, reliable query optimization
 *
 * @param query - Original user query
 * @returns Promise resolving to optimized queries
 */
export const rewriteQuery = async (query: string) => {
  const queryRewriteAgent = createQueryRewriteAgent();

  const result = await queryRewriteAgent.generate(
    [{ role: 'user', content: `Original query: ${query}` }],
    {
      output: z.object({
        semanticQuery: z
          .string()
          .describe(
            'Query optimized for semantic/vector search with expanded concepts and context'
          ),
        keywordQuery: z
          .string()
          .describe(
            'Query optimized for keyword/full-text search with specific terms'
          ),
        reasoning: z
          .string()
          .describe('Brief explanation of how queries were optimized')
          .optional(),
      }),
    }
  );

  return result.object;
};

/**
 * Helper function to generate general knowledge responses
 *
 * @param query - User's query
 * @param chatHistory - Previous conversation context
 * @returns Promise resolving to response text
 */
export const generateGeneralKnowledgeResponse = async (
  query: string,
  chatHistory: string = ''
): Promise<string> => {
  const generalAgent = createGeneralKnowledgeAgent();

  const messages = chatHistory
    ? [
        {
          role: 'system' as const,
          content: `Previous conversation: ${chatHistory}`,
        },
        { role: 'user' as const, content: query },
      ]
    : [{ role: 'user' as const, content: query }];

  const result = await generalAgent.generate(messages);
  return result.text;
};

/**
 * Agent configuration for easy access
 */
export const AgentConfig = {
  QUERY_REWRITE: 'query-optimizer',
  INTENT_RECOGNITION: 'intent-classifier',
  GENERAL_KNOWLEDGE: 'general-knowledge-assistant',
} as const;

/**
 * Export all agent creation functions
 */
export const AIAgents = {
  createQueryRewriteAgent,
  createIntentRecognitionAgent,
  createGeneralKnowledgeAgent,
  assessUserIntent,
  rewriteQuery,
  generateGeneralKnowledgeResponse,
} as const;
