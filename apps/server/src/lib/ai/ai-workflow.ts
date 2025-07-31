/**
 * AI Assistant Workflow Implementation
 *
 * This file provides a workflow-based approach to AI assistant operations
 * for more complex, multi-step scenarios that require explicit orchestration.
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  processAIRequest,
  AssistantRequest,
  AssistantResponse,
} from './ai-service';

/**
 * Input schema for the AI assistant workflow
 */
const workflowInputSchema = z.object({
  userInput: z.string().describe("The user's query or request"),
  workspaceId: z.string().describe('ID of the workspace'),
  userId: z.string().describe('ID of the requesting user'),
  userDetails: z.object({
    name: z.string().describe("User's display name"),
    email: z.string().describe("User's email address"),
  }),
  parentMessageId: z
    .string()
    .optional()
    .describe('ID of parent message for context'),
  currentMessageId: z.string().optional().describe('ID of current message'),
  selectedContextNodeIds: z
    .array(z.string())
    .optional()
    .describe('Specific nodes to search within'),
});

/**
 * Output schema for the AI assistant workflow
 */
const workflowOutputSchema = z.object({
  finalAnswer: z.string().describe("The assistant's final response"),
  citations: z
    .array(
      z.object({
        sourceId: z.string().describe('ID of the source document/node'),
        quote: z.string().describe('Relevant quote from the source'),
      })
    )
    .describe('Citations supporting the response'),
  intent: z.enum(['retrieve', 'no_context']).describe('Determined user intent'),
  searchPerformed: z
    .boolean()
    .describe('Whether workspace search was performed'),
  processingTimeMs: z
    .number()
    .describe('Total processing time in milliseconds'),
  workflowSteps: z.array(z.string()).describe('Steps executed in the workflow'),
});

/**
 * Step 1: Request Validation and Preprocessing
 */
const validateRequestStep = createStep({
  id: 'validate-request',
  description: 'Validate and preprocess the incoming AI request',
  inputSchema: workflowInputSchema,
  outputSchema: workflowInputSchema.extend({
    validated: z.boolean(),
    validationErrors: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData }) => {
    console.log('🔍 Validating AI request...');

    const errors: string[] = [];

    // Validate required fields
    if (!inputData.userInput.trim()) {
      errors.push('User input cannot be empty');
    }

    if (!inputData.workspaceId) {
      errors.push('Workspace ID is required');
    }

    if (!inputData.userId) {
      errors.push('User ID is required');
    }

    if (!inputData.userDetails.name) {
      errors.push('User name is required');
    }

    const validated = errors.length === 0;

    if (!validated) {
      console.log('❌ Request validation failed:', errors);
    } else {
      console.log('✅ Request validation passed');
    }

    return {
      ...inputData,
      validated,
      validationErrors: errors.length > 0 ? errors : undefined,
    };
  },
});

/**
 * Step 2: Process AI Request
 */
const processRequestStep = createStep({
  id: 'process-request',
  description: 'Process the AI request using the assistant service',
  inputSchema: workflowInputSchema.extend({
    validated: z.boolean(),
    validationErrors: z.array(z.string()).optional(),
  }),
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    console.log('🤖 Processing AI request through service...');

    // If validation failed, return error response
    if (!inputData.validated) {
      const errorMessage = `Request validation failed: ${inputData.validationErrors?.join(', ')}`;
      return {
        finalAnswer: errorMessage,
        citations: [],
        intent: 'no_context' as const,
        searchPerformed: false,
        processingTimeMs: 0,
        workflowSteps: ['validate-request', 'process-request (failed)'],
      };
    }

    // Process the request
    const request: AssistantRequest = {
      userInput: inputData.userInput,
      workspaceId: inputData.workspaceId,
      userId: inputData.userId,
      userDetails: inputData.userDetails,
      parentMessageId: inputData.parentMessageId,
      currentMessageId: inputData.currentMessageId,
      selectedContextNodeIds: inputData.selectedContextNodeIds,
    };

    const response = await processAIRequest(request);

    console.log('✅ AI request processed successfully');

    return {
      ...response,
      workflowSteps: ['validate-request', 'process-request'],
    };
  },
});

/**
 * Main AI Assistant Workflow
 *
 * This workflow provides a structured approach to processing AI requests
 * with validation, error handling, and step tracking.
 */
export const aiAssistantWorkflow = createWorkflow({
  id: 'ai-assistant-workflow',
  description: 'Complete AI assistant workflow with validation and processing',
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
})
  .then(validateRequestStep)
  .then(processRequestStep)
  .commit();

/**
 * Execute the AI assistant workflow
 *
 * @param input - Workflow input parameters
 * @returns Promise resolving to the workflow result
 */
export const executeAIWorkflow = async (
  input: z.infer<typeof workflowInputSchema>
) => {
  console.log('🔄 Starting AI assistant workflow...');

  const run = await aiAssistantWorkflow.createRunAsync();

  const result = await run.start({
    inputData: {
      ...input,
      selectedContextNodeIds: input.selectedContextNodeIds || [],
    },
  });

  if (result.status === 'success') {
    console.log('✅ AI workflow completed successfully');
    return {
      success: true,
      data: result.result,
    };
  } else {
    console.error('❌ AI workflow failed:', result);
    return {
      success: false,
      error: result.error || 'Workflow execution failed',
      data: {
        finalAnswer:
          'I apologize, but I encountered an error while processing your request. Please try again.',
        citations: [],
        intent: 'no_context' as const,
        searchPerformed: false,
        processingTimeMs: 0,
        workflowSteps: ['workflow-failed'],
      },
    };
  }
};

/**
 * Simplified workflow runner for common use cases
 *
 * @param request - Assistant request parameters
 * @returns Promise resolving to the assistant response
 */
export const runAIWorkflow = async (
  request: AssistantRequest
): Promise<AssistantResponse> => {
  const result = await executeAIWorkflow(request);
  return result.data;
};

/**
 * Workflow configuration constants
 */
export const WorkflowConfig = {
  ID: 'ai-assistant-workflow',
  DESCRIPTION: 'Complete AI assistant workflow with validation and processing',
  MAX_EXECUTION_TIME_MS: 60000, // 60 seconds
  STEPS: {
    VALIDATE: 'validate-request',
    PROCESS: 'process-request',
  },
} as const;

/**
 * Export workflow utilities
 */
export const AIWorkflow = {
  execute: executeAIWorkflow,
  run: runAIWorkflow,
  workflow: aiAssistantWorkflow,
  config: WorkflowConfig,
} as const;
