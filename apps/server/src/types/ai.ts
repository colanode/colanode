import { z } from 'zod';

// ============================================================================
// WORKFLOW INPUT/OUTPUT SCHEMAS
// ============================================================================

export const assistantWorkflowInputSchema = z.object({
  userInput: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  workspaceName: z.string(),
  userDetails: z.object({
    name: z.string(),
    email: z.string(),
  }),
  parentMessageId: z.string().optional(),
  currentMessageId: z.string().optional(),
  selectedContextNodeIds: z.array(z.string()).optional(),
});

export const assistantWorkflowOutputSchema = z.object({
  finalAnswer: z.string(),
  citations: z.array(
    z.object({
      sourceId: z.string(),
      quote: z.string(),
    })
  ),
  searchPerformed: z.boolean().optional(),
  processingTimeMs: z.number().optional(),
});

// ============================================================================
// WORKFLOW STEP SCHEMAS
// ============================================================================

export const intentClassificationOutputSchema = z.object({
  intent: z.enum(['no_context', 'retrieve']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  originalInput: z.string(),
});

export const queryRewriteOutputSchema = z.object({
  semanticQueries: z.array(z.string()).min(1),
  keywordQuery: z.string().optional().default(''),
  originalQuery: z.string(),
  intent: z.enum(['no_context', 'retrieve']),
});

export const searchResultsOutputSchema = z.object({
  results: z.array(
    z.object({
      content: z.string(),
      sourceId: z.string(),
      score: z.number(),
      type: z.string(),
      metadata: z.array(z.record(z.string(), z.any())),
    })
  ),
  searchType: z.enum(['semantic', 'keyword', 'database', 'hybrid']),
  totalFound: z.number(),
});

export const rankedResultsOutputSchema = z.object({
  rankedResults: z.array(
    z.object({
      content: z.string(),
      sourceId: z.string(),
      relevanceScore: z.number(),
      type: z.string(),
      metadata: z.array(z.record(z.string(), z.any())),
    })
  ),
  citations: z.array(
    z.object({
      sourceId: z.string(),
      quote: z.string(),
    })
  ),
  searchPerformed: z.boolean(),
});

export const answerOutputSchema = z.object({
  finalAnswer: z.string(),
  additionalCitations: z
    .array(
      z.object({
        sourceId: z.string(),
        quote: z.string(),
      })
    )
    .optional(),
  usedContext: z.boolean(),
});

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

export const WorkflowConfig = {
  MAX_STEPS: 3,
  CONTEXT_RELEVANCE_THRESHOLD: 0.7,
  DEFAULT_TIMEOUT_MS: 30000,
  MAX_SEARCH_RESULTS: 20,
  MAX_CITATION_RESULTS: 10,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AssistantWorkflowInput = z.infer<
  typeof assistantWorkflowInputSchema
>;
export type AssistantWorkflowOutput = z.infer<
  typeof assistantWorkflowOutputSchema
>;
export type IntentClassificationOutput = z.infer<
  typeof intentClassificationOutputSchema
>;
export type QueryRewriteOutput = z.infer<typeof queryRewriteOutputSchema>;
export type SearchResultsOutput = z.infer<typeof searchResultsOutputSchema>;
export type RankedResultsOutput = z.infer<typeof rankedResultsOutputSchema>;
export type AnswerOutput = z.infer<typeof answerOutputSchema>;

// =========================================================================
// HYBRID SEARCH ARGS
// =========================================================================

export type HybridSearchArgs = {
  semanticQueries: string[];
  keywordQuery?: string;
  workspaceId: string;
  userId: string;
  maxResults?: number;
  selectedContextNodeIds?: string[];
};
