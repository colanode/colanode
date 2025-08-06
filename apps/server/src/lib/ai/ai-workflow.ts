import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  createIntentAgent,
  createAnswerAgent,
  createQueryAgent,
  createRerankAgent,
} from './ai-agents';
import { createAITools } from './ai-tools';
import {
  assistantWorkflowInputSchema,
  assistantWorkflowOutputSchema,
  intentClassificationOutputSchema,
  queryRewriteOutputSchema,
  searchResultsOutputSchema,
  rankedResultsOutputSchema,
  answerOutputSchema,
} from '@colanode/server/types/ai';

const intentClassificationStep = createStep({
  id: 'intent-classification-step',
  description:
    'Classify user intent: general knowledge vs workspace-specific query',
  inputSchema: assistantWorkflowInputSchema,
  outputSchema: intentClassificationOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const intentAgent = createIntentAgent();

    const prompt = `You are an intent classifier. Your only job is to determine if this query needs workspace data.

Query: "${inputData.userInput}"

Classify as:
- "no_context": General knowledge, explanations, calculations, definitions
- "retrieve": Workspace-specific content, documents, people, or data

Examples:
- "What is TypeScript?" → no_context
- "How do I write clean code?" → no_context  
- "Show me recent documents" → retrieve
- "Find projects by John" → retrieve

Respond with just the classification and your confidence (0-1).`;

    try {
      const response = await intentAgent.generate(
        [{ role: 'user', content: prompt }],
        {
          runtimeContext,
          output: z.object({
            intent: z.enum(['no_context', 'retrieve']),
            confidence: z.number().min(0).max(1),
            reasoning: z.string().optional(),
          }),
        }
      );

      console.log(
        `🎯 Intent: ${response.object.intent} (confidence: ${response.object.confidence})`
      );

      return {
        intent: response.object.intent,
        confidence: response.object.confidence,
        reasoning: response.object.reasoning,
        originalInput: inputData.userInput,
      };
    } catch (error) {
      throw error;
    }
  },
});

const queryRewriteStep = createStep({
  id: 'query-rewrite-step',
  description: 'Optimize user query for semantic and keyword search',
  inputSchema: intentClassificationOutputSchema,
  outputSchema: queryRewriteOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const queryAgent = createQueryAgent();

    const prompt = `Original Query: "${inputData.originalInput}"

Create two optimized versions for search.`;

    try {
      const response = await queryAgent.generate(
        [{ role: 'user', content: prompt }],
        {
          runtimeContext,
          output: z.object({
            semanticQuery: z.string(),
            keywordQuery: z.string(),
          }),
        }
      );

      console.log(`🔍 Semantic query: "${response.object.semanticQuery}"`);
      console.log(`🔑 Keyword query: "${response.object.keywordQuery}"`);

      return {
        semanticQuery: response.object.semanticQuery,
        keywordQuery: response.object.keywordQuery,
        originalQuery: inputData.originalInput,
        intent: inputData.intent,
      };
    } catch (error) {
      throw error;
    }
  },
});

const runSearchesStep = createStep({
  id: 'run-searches-step',
  description: 'Execute parallel semantic and keyword searches',
  inputSchema: queryRewriteOutputSchema,
  outputSchema: searchResultsOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const workspaceId = runtimeContext?.get('workspaceId') as string;
    const userId = runtimeContext?.get('userId') as string;
    const selectedContextNodeIds =
      (runtimeContext?.get('selectedContextNodeIds') as string[]) || [];

    if (!workspaceId || !userId) {
      console.error('❌ Missing required runtime context for search');
      throw new Error('Missing required runtime context for search');
    }

    console.log(`🔍 Running parallel searches...`);
    console.log(`   Semantic: "${inputData.semanticQuery}"`);
    console.log(`   Keyword: "${inputData.keywordQuery}"`);

    try {
      const tools = createAITools();

      // Run granular searches in parallel
      const [semanticResults, keywordResults] = await Promise.all([
        tools.semanticSearch.execute({
          context: {
            query: inputData.semanticQuery,
            workspaceId,
            userId,
            maxResults: 15, // Get more from each search for better combination
            selectedContextNodeIds,
          },
          runtimeContext,
        }),
        tools.keywordSearch.execute({
          context: {
            query: inputData.keywordQuery,
            workspaceId,
            userId,
            maxResults: 15,
            selectedContextNodeIds,
          },
          runtimeContext,
        }),
      ]);

      // Combine results from both search types
      const allResults = [
        ...semanticResults.results,
        ...keywordResults.results,
      ];

      console.log(`📊 Search completed: ${allResults.length} total results`);
      console.log(`   - Semantic: ${semanticResults.results.length}`);
      console.log(`   - Keyword: ${keywordResults.results.length}`);

      return {
        results: allResults,
        searchType: 'hybrid' as const,
        totalFound: allResults.length,
      };
    } catch (error) {
      console.error('❌ Search execution failed:', error);
      throw error;
    }
  },
});

const combineResultsStep = createStep({
  id: 'combine-results-step',
  description: 'Combine and score search results using RRF algorithm',
  inputSchema: searchResultsOutputSchema,
  outputSchema: searchResultsOutputSchema, // Same schema for now
  execute: async ({ inputData }) => {
    if (inputData.results.length === 0) {
      console.log('📭 No results to combine');
      return inputData; // Pass through if no results
    }

    console.log(`🔄 Combining ${inputData.results.length} search results`);

    // Simple combination: remove duplicates and apply recency boost
    const uniqueResults = new Map();

    inputData.results.forEach((result, index) => {
      const key = result.sourceId;

      if (!uniqueResults.has(key)) {
        // Apply position-based scoring (earlier results get higher scores)
        const positionScore = 1 / (index + 1);
        const recencyBoost = result.metadata.createdAt
          ? Math.max(
              0,
              1 -
                (Date.now() - new Date(result.metadata.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
            ) // 30 days
          : 0;

        const combinedScore =
          result.score * 0.7 + positionScore * 0.2 + recencyBoost * 0.1;

        uniqueResults.set(key, {
          ...result,
          score: Math.min(1, combinedScore), // Cap at 1.0
        });
      }
    });

    // Sort by combined score
    const combinedResults = Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Top 20 results

    console.log(`✅ Combined to ${combinedResults.length} unique results`);

    return {
      results: combinedResults,
      searchType: inputData.searchType,
      totalFound: combinedResults.length,
    };
  },
});

const rerankStep = createStep({
  id: 'rerank-step',
  description: 'Rerank search results for relevance using LLM',
  inputSchema: searchResultsOutputSchema,
  outputSchema: rankedResultsOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    if (inputData.results.length === 0) {
      console.log('📭 No results to rerank');
      return {
        rankedResults: [],
        citations: [],
        searchPerformed: false,
      };
    }

    const originalQuery =
      (runtimeContext?.get('userInput') as string) || 'query';
    console.log(
      `🎯 Reranking ${inputData.results.length} results for query: "${originalQuery}"`
    );

    try {
      const rerankAgent = createRerankAgent();

      // Format results for reranking
      const resultsText = inputData.results
        .map(
          (result, index) => `[${index}] ${result.content.substring(0, 300)}`
        )
        .join('\n\n');

      const prompt = `Query: "${originalQuery}"

Results to score (0.0 to 1.0 for relevance):

${resultsText}

Score each result based on how well it answers the query.`;

      const response = await rerankAgent.generate(
        [{ role: 'user', content: prompt }],
        {
          runtimeContext,
          output: z.object({
            scores: z.array(z.number().min(0).max(1)),
          }),
        }
      );

      // Apply scores and sort by relevance
      const rankedResults = inputData.results
        .map((result, index) => ({
          content: result.content,
          sourceId: result.sourceId,
          relevanceScore: response.object.scores[index] || 0.5,
          type: result.type,
          metadata: result.metadata,
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20); // Top 20 results

      // Generate citations from top results
      const citations = rankedResults
        .slice(0, 10) // Top 10 for citations
        .map((result) => ({
          sourceId: result.sourceId,
          quote:
            result.content.substring(0, 200).trim() +
            (result.content.length > 200 ? '...' : ''),
        }));

      console.log(
        `✅ Reranked to ${rankedResults.length} results with ${citations.length} citations`
      );

      return {
        rankedResults,
        citations,
        searchPerformed: true,
      };
    } catch (error) {
      throw error;
    }
  },
});

const answerWithContextStep = createStep({
  id: 'answer-with-context-step',
  description: 'Generate response using retrieved context and citations',
  inputSchema: rankedResultsOutputSchema,
  outputSchema: answerOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const answerAgent = createAnswerAgent();
    const userQuery =
      (runtimeContext?.get('userInput') as string) || 'User query';

    if (inputData.rankedResults.length === 0) {
      throw new Error('No context available for answering the query');
    }

    // Format context for the LLM
    const contextText = inputData.rankedResults
      .slice(0, 10) // Top 10 results
      .map((item, index) => `[Source ${index + 1}] ${item.content}`)
      .join('\n\n');

    console.log(
      `📚 Generating response with ${inputData.rankedResults.length} context items`
    );

    const prompt = `Answer the user's question using the provided workspace context.

**User Question:** ${userQuery}

**Workspace Context:**
${contextText}

**Instructions:**
- Use the context as your primary information source
- Cite sources using [Source N] format when referencing context
- If the context doesn't fully answer the question, combine it with general knowledge but clearly distinguish between the two
- Provide specific, actionable information when possible
- Be conversational but professional`;

    try {
      const response = await answerAgent.generate(
        [{ role: 'user', content: prompt }],
        { runtimeContext }
      );

      console.log(
        `✅ Generated contextual response (${response.text.length} characters)`
      );

      return {
        finalAnswer: response.text,
        additionalCitations: [], // Citations already handled in previous step
        usedContext: true,
      };
    } catch (error) {
      console.error('❌ Contextual answer generation failed:', error);
      throw error;
    }
  },
});

const answerDirectStep = createStep({
  id: 'answer-direct-step',
  description: 'Generate direct response using general knowledge',
  inputSchema: intentClassificationOutputSchema,
  outputSchema: answerOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const answerAgent = createAnswerAgent();

    console.log('📝 Generating direct response for general knowledge query');

    const prompt = `Answer this general knowledge question with a comprehensive, helpful response.

**Question:** ${inputData.originalInput}

**Instructions:**
- Provide accurate, detailed information
- Use examples and explanations where helpful
- Be educational and thorough
- Use clear, professional language
- Don't reference any workspace-specific information`;

    try {
      const response = await answerAgent.generate(
        [{ role: 'user', content: prompt }],
        { runtimeContext }
      );

      console.log(
        `✅ Generated direct response (${response.text.length} characters)`
      );

      return {
        finalAnswer: response.text,
        additionalCitations: [],
        usedContext: false,
      };
    } catch (error) {
      console.error('❌ Direct answer generation failed:', error);
      throw error;
    }
  },
});

const formatContextOutputStep = createStep({
  id: 'format-context-output-step',
  description: 'Format the final assistant response output with context',
  inputSchema: answerOutputSchema,
  outputSchema: assistantWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    console.log(`📋 Formatting context-based response output`);

    const response = {
      finalAnswer: inputData.finalAnswer,
      citations: inputData.additionalCitations || [],
      searchPerformed: inputData.usedContext,
    };

    console.log(`✅ Formatted response with context`);
    console.log(
      `📊 Search performed: ${response.searchPerformed ? 'Yes' : 'No'}`
    );
    console.log(
      `💬 Response length: ${response.finalAnswer.length} characters`
    );

    return response;
  },
});

const formatDirectOutputStep = createStep({
  id: 'format-direct-output-step',
  description: 'Format the final assistant direct response output',
  inputSchema: answerOutputSchema,
  outputSchema: assistantWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    console.log(`📋 Formatting direct response output (no context used)`);

    const response = {
      finalAnswer: inputData.finalAnswer,
      citations: inputData.additionalCitations || [],
      searchPerformed: false,
    };

    console.log(`✅ Formatted direct response`);
    console.log(
      `💬 Response length: ${response.finalAnswer.length} characters`
    );

    return response;
  },
});

export const assistantWorkflow = createWorkflow({
  id: 'assistant-workflow',
  description:
    'Declarative AI assistant workflow optimized for smaller LLMs with proper branching',
  inputSchema: assistantWorkflowInputSchema,
  outputSchema: assistantWorkflowOutputSchema,
})
  // Step 1: Always classify intent first
  .then(intentClassificationStep)

  // Step 2: Branch based on intent classification
  .branch([
    // RETRIEVE BRANCH: RAG pipeline for workspace-specific queries
    [
      async ({ inputData }) => inputData.intent === 'retrieve',
      createWorkflow({
        id: 'retrieve-branch',
        inputSchema: intentClassificationOutputSchema,
        outputSchema: assistantWorkflowOutputSchema,
      })
        .then(queryRewriteStep) // Optimize query for search
        .then(runSearchesStep) // Execute parallel searches
        .then(combineResultsStep) // Combine results algorithmically
        .then(rerankStep) // LLM-based reranking
        .then(answerWithContextStep) // Generate answer with context
        .then(formatContextOutputStep) // Format output
        .commit(),
    ],

    // NO_CONTEXT BRANCH: Direct answer for general knowledge queries
    [
      async ({ inputData }) => inputData.intent === 'no_context',
      createWorkflow({
        id: 'no-context-branch',
        inputSchema: intentClassificationOutputSchema,
        outputSchema: assistantWorkflowOutputSchema,
      })
        .then(answerDirectStep) // Generate direct answer
        .then(formatDirectOutputStep) // Format output
        .commit(),
    ],
  ])
  .commit();
