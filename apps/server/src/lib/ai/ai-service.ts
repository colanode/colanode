/**
 * AI Assistant Service
 *
 * This file provides the main service layer for AI assistant operations.
 * It orchestrates the interaction between agents, tools, and workspace data.
 */

import { RuntimeContext } from '@mastra/core/runtime-context';
import { getNodeModel } from '@colanode/core';

import { database } from '@colanode/server/data/database';
import { initializeAISystem } from './ai-assistant';
import { AIAgents } from './ai-agents';
import { isAIEnabled } from './ai-models';

/**
 * Input parameters for assistant requests
 */
export interface AssistantRequest {
  userInput: string;
  workspaceId: string;
  userId: string;
  userDetails: {
    name: string;
    email: string;
  };
  parentMessageId?: string;
  currentMessageId?: string;
  selectedContextNodeIds?: string[];
}

/**
 * Response from the assistant
 */
export interface AssistantResponse {
  finalAnswer: string;
  citations: Array<{
    sourceId: string;
    quote: string;
  }>;
  intent?: 'retrieve' | 'no_context';
  searchPerformed?: boolean;
  processingTimeMs?: number;
}

/**
 * Main AI Assistant Service
 *
 * This service provides the primary interface for AI assistant operations.
 * It handles the complete flow from user input to final response.
 */
export class AIAssistantService {
  private aiSystem: ReturnType<typeof initializeAISystem>;

  constructor() {
    this.aiSystem = initializeAISystem();
  }

  /**
   * Process a user request and generate an AI response
   *
   * @param request - The user's request with context
   * @returns Promise resolving to the assistant's response
   */
  async processRequest(request: AssistantRequest): Promise<AssistantResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(
        `🤖 [${requestId}] Processing AI request from user ${request.userDetails.name}`
      );
      console.log(`📝 [${requestId}] Query: "${request.userInput}"`);
      console.log(`🔧 [${requestId}] Workspace: ${request.workspaceId}`);

      // Check if AI is enabled
      if (!isAIEnabled()) {
        throw new Error('AI functionality is disabled');
      }

      // Prepare runtime context
      const contextStartTime = Date.now();
      const runtimeContext = await this.prepareRuntimeContext(request);
      const contextTime = Date.now() - contextStartTime;
      console.log(
        `⚙️ [${requestId}] Runtime context prepared in ${contextTime}ms`
      );

      // Get chat history for context
      const historyStartTime = Date.now();
      const chatHistory = await this.getChatHistory(request);
      const historyTime = Date.now() - historyStartTime;
      console.log(
        `📚 [${requestId}] Chat history retrieved in ${historyTime}ms (${chatHistory.length} chars)`
      );

      // Determine user intent
      const intentStartTime = Date.now();
      const intent = await AIAgents.assessUserIntent(
        request.userInput,
        chatHistory
      );
      const intentTime = Date.now() - intentStartTime;
      console.log(
        `🎯 [${requestId}] Intent determined: ${intent} (${intentTime}ms)`
      );

      let response: AssistantResponse;

      if (intent === 'no_context') {
        // Handle general knowledge queries
        console.log(`🌍 [${requestId}] Processing as general knowledge query`);
        response = await this.handleGeneralKnowledgeQuery(request, chatHistory);
      } else {
        // Handle workspace-specific queries
        console.log(`🏢 [${requestId}] Processing as workspace query`);
        response = await this.handleWorkspaceQuery(request, runtimeContext);
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `✅ [${requestId}] AI request completed in ${processingTime}ms`
      );
      console.log(
        `📊 [${requestId}] Performance metrics: context=${contextTime}ms, history=${historyTime}ms, intent=${intentTime}ms, total=${processingTime}ms`
      );

      return {
        ...response,
        intent,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(
        `❌ [${requestId}] AI request processing failed after ${processingTime}ms:`,
        error
      );

      // Enhanced error telemetry
      const errorDetails = {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        request: {
          workspaceId: request.workspaceId,
          userId: request.userId,
          queryLength: request.userInput.length,
        },
        processingTimeMs: processingTime,
      };
      console.error(`🔍 [${requestId}] Error details:`, errorDetails);

      return {
        finalAnswer:
          'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
        citations: [],
        intent: 'no_context',
        searchPerformed: false,
        processingTimeMs: processingTime,
      };
    }
  }

  /**
   * Handle general knowledge queries that don't require workspace context
   */
  private async handleGeneralKnowledgeQuery(
    request: AssistantRequest,
    chatHistory: string
  ): Promise<AssistantResponse> {
    console.log('🌍 Handling general knowledge query');

    const response = await AIAgents.generateGeneralKnowledgeResponse(
      request.userInput,
      chatHistory
    );

    return {
      finalAnswer: response,
      citations: [],
      searchPerformed: false,
    };
  }

  /**
   * Handle workspace-specific queries that require context retrieval
   */
  private async handleWorkspaceQuery(
    request: AssistantRequest,
    runtimeContext: RuntimeContext
  ): Promise<AssistantResponse> {
    console.log('🏢 Handling workspace-specific query');

    const assistant = this.aiSystem.agents.assistant;

    // Generate response using the assistant with tools
    const response = await assistant.generate(
      [{ role: 'user', content: request.userInput }],
      {
        runtimeContext,
        maxSteps: 3, // Allow up to 3 tool calls
      }
    );

    // Extract citations from tool results
    const citations = this.extractCitationsFromResponse(response);
    const searchPerformed = this.determineIfSearchWasPerformed(response);

    console.log(`📚 Extracted ${citations.length} citations from tool results`);

    return {
      finalAnswer: response.text,
      citations,
      searchPerformed,
    };
  }

  /**
   * Extract citations from agent response that contains tool calls
   */
  private extractCitationsFromResponse(
    response: any
  ): Array<{ sourceId: string; quote: string }> {
    const citations: Array<{ sourceId: string; quote: string }> = [];

    try {
      // Check if response has tool calls/results
      if (response.toolCalls && Array.isArray(response.toolCalls)) {
        for (const toolCall of response.toolCalls) {
          if (
            toolCall.toolName === 'workspace-document-search' &&
            toolCall.result
          ) {
            const searchResults = toolCall.result.results || [];
            for (const result of searchResults) {
              if (result.sourceId && result.content) {
                // Extract a meaningful quote from the content (first 200 chars)
                const quote = result.content.substring(0, 200).trim();
                if (quote) {
                  citations.push({
                    sourceId: result.sourceId,
                    quote: quote + (result.content.length > 200 ? '...' : ''),
                  });
                }
              }
            }
          }

          if (
            toolCall.toolName === 'workspace-database-filter' &&
            toolCall.result
          ) {
            const dbResults = toolCall.result.results || [];
            for (const result of dbResults) {
              if (result.metadata?.id && result.content) {
                const quote = result.content.substring(0, 200).trim();
                if (quote) {
                  citations.push({
                    sourceId: result.metadata.id,
                    quote: quote + (result.content.length > 200 ? '...' : ''),
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Error extracting citations:', error);
    }

    return citations;
  }

  /**
   * Determine if search was performed based on tool calls
   */
  private determineIfSearchWasPerformed(response: any): boolean {
    try {
      if (response.toolCalls && Array.isArray(response.toolCalls)) {
        return response.toolCalls.some((toolCall: any) =>
          ['workspace-document-search', 'workspace-database-filter'].includes(
            toolCall.toolName
          )
        );
      }
    } catch (error) {
      console.error('⚠️ Error determining search status:', error);
    }
    return false;
  }

  /**
   * Prepare runtime context for the AI assistant
   */
  private async prepareRuntimeContext(
    request: AssistantRequest
  ): Promise<RuntimeContext> {
    // Get workspace details
    const workspace = await database
      .selectFrom('workspaces')
      .where('id', '=', request.workspaceId)
      .select(['name', 'id'])
      .executeTakeFirst();

    // Create and populate runtime context
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('workspaceName', workspace?.name || request.workspaceId);
    runtimeContext.set('userName', request.userDetails.name);
    runtimeContext.set('userEmail', request.userDetails.email);
    runtimeContext.set('workspaceId', request.workspaceId);
    runtimeContext.set('userId', request.userId);
    runtimeContext.set(
      'selectedContextNodeIds',
      request.selectedContextNodeIds || []
    );

    return runtimeContext;
  }

  /**
   * Get chat history for conversation context
   */
  private async getChatHistory(request: AssistantRequest): Promise<string> {
    if (!request.parentMessageId && !request.currentMessageId) {
      return '';
    }

    const messages = await database
      .selectFrom('nodes')
      .where(
        'parent_id',
        '=',
        request.parentMessageId || request.currentMessageId || ''
      )
      .where('type', '=', 'message')
      .where('id', '!=', request.currentMessageId || '')
      .where('workspace_id', '=', request.workspaceId)
      .orderBy('created_at', 'asc')
      .selectAll()
      .execute();

    const chatHistory = messages
      .map((message) => {
        const isAI = message.created_by === 'colanode_ai';
        const extracted =
          message &&
          message.attributes &&
          getNodeModel(message.type)?.extractText(
            message.id,
            message.attributes
          );
        const text = extracted?.attributes || '';

        return `${isAI ? 'Assistant' : 'User'}: ${text}`;
      })
      .join('\n');

    return chatHistory;
  }

  /**
   * Get the Mastra instance for advanced usage
   */
  getMastraInstance() {
    return this.aiSystem.mastra;
  }

  /**
   * Get a specific agent by name
   */
  getAgent(
    name:
      | 'assistant'
      | 'queryRewriter'
      | 'intentClassifier'
      | 'generalKnowledge'
  ) {
    return this.aiSystem.mastra.getAgent(name);
  }

  /**
   * Health check for the AI system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: string;
  }> {
    try {
      if (!isAIEnabled()) {
        return {
          status: 'unhealthy',
          details: 'AI is disabled in configuration',
        };
      }

      // Try a simple operation
      const testResponse = await AIAgents.assessUserIntent('test query');

      return {
        status: 'healthy',
        details: `AI system operational, intent: ${testResponse}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: `AI system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Singleton instance of the AI Assistant Service
 */
let aiServiceInstance: AIAssistantService | null = null;

/**
 * Get the AI Assistant Service instance
 *
 * @returns Singleton instance of AIAssistantService
 */
export const getAIService = (): AIAssistantService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIAssistantService();
  }
  return aiServiceInstance;
};

/**
 * Convenience function to process an AI request
 *
 * @param request - The assistant request
 * @returns Promise resolving to the assistant response
 */
export const processAIRequest = async (
  request: AssistantRequest
): Promise<AssistantResponse> => {
  const service = getAIService();
  return await service.processRequest(request);
};

/**
 * Service configuration constants
 */
export const AIServiceConfig = {
  MAX_PROCESSING_TIME_MS: 30000, // 30 seconds
  DEFAULT_MAX_STEPS: 3,
  CHAT_HISTORY_LIMIT: 20, // Maximum number of previous messages to consider
} as const;
