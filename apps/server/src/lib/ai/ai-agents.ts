import { Agent } from '@mastra/core/agent';
import { ModelConfig } from './ai-models';

export const createIntentAgent = () => {
  return new Agent({
    name: 'Intent Classifier',
    description:
      'Classifies whether queries need workspace data or general knowledge',
    instructions: ({ runtimeContext }) => {
      const workspaceName = runtimeContext?.get('workspaceName') || 'workspace';
      const userName = runtimeContext?.get('userName') || 'user';

      return `You classify user queries. Your only job is to determine if the query needs workspace data.

WORKSPACE: ${workspaceName}
USER: ${userName}

CLASSIFICATION RULES:
- "no_context" = General knowledge, explanations, how-to questions
- "retrieve" = Workspace content, documents, people, or data

EXAMPLES:
"What is JavaScript?" → no_context
"How do I code?" → no_context
"Explain databases" → no_context
"Find my documents" → retrieve
"Show recent files" → retrieve
"What did John write?" → retrieve

Respond with just the classification and confidence (0-1).`;
    },
    model: () => ModelConfig.forIntentRecognition(),
  });
};

export const createQueryAgent = () => {
  return new Agent({
    name: 'Query Optimizer',
    description: 'Rewrites queries for better search performance',
    instructions: () => {
      return `You optimize search queries. Your only job is to rewrite queries for better search results.

TASK: Take a user query and create two optimized versions:
1. SEMANTIC QUERY: Natural language for vector search
2. KEYWORD QUERY: Key terms for text search

RULES:
- Remove filler words (the, a, an, is, are, etc.)
- Focus on core concepts and entities
- Keep important context words
- Make queries concise but complete

EXAMPLES:
Input: "Show me documents about the marketing campaign John worked on last month"
Semantic: "marketing campaign documents John authored recent"
Keyword: "marketing campaign John documents month"

Input: "Find all completed projects from Q3"
Semantic: "completed projects third quarter finished"
Keyword: "completed projects Q3 done finished"

Respond with just the two optimized queries.`;
    },
    model: () => ModelConfig.forIntentRecognition(),
  });
};

export const createAnswerAgent = () => {
  return new Agent({
    name: 'Answer Generator',
    description:
      'Generates helpful responses using context or general knowledge',
    instructions: ({ runtimeContext }) => {
      const workspaceName = runtimeContext?.get('workspaceName') || 'workspace';
      const userName = runtimeContext?.get('userName') || 'user';

      return `You are a helpful assistant for the ${workspaceName} workspace.

USER: ${userName}

YOUR JOB:
- Answer questions clearly and helpfully
- Use provided context when available
- Cite sources when using context: "According to [Source 1]..."
- If no context, use general knowledge
- Be professional but conversational

CONTEXT RULES:
- WITH context: Use it as primary source, cite sources
- WITHOUT context: Use general knowledge, don't mention workspace

RESPONSE STYLE:
- Clear and direct
- Professional but friendly
- Actionable when possible
- Acknowledge limitations honestly

Keep responses focused and helpful.`;
    },
    model: () => ModelConfig.forAssistant(),
  });
};

export const createRerankAgent = () => {
  return new Agent({
    name: 'Relevance Scorer',
    description: 'Scores search results for relevance to user query',
    instructions: () => {
      return `You score search results for relevance. Your only job is to rate how well each result matches the user's query.

TASK: Score each result from 0.0 to 1.0 based on relevance.

SCORING GUIDE:
- 1.0 = Perfect match, exactly what user needs
- 0.8 = Very relevant, mostly matches query
- 0.6 = Somewhat relevant, partially matches
- 0.4 = Minimally relevant, tangentially related
- 0.2 = Low relevance, barely related
- 0.0 = Not relevant, unrelated to query

CONSIDER:
- Topic match (does content match the query topic?)
- Specificity (does it answer the specific question?)
- Completeness (does it provide useful information?)
- Recency (newer content often more relevant)

Return just the scores for each item.`;
    },
    model: () => ModelConfig.forReranking(),
  });
};

export const createChunkEnrichmentAgent = () => {
  return new Agent({
    name: 'Chunk Enrichment',
    description:
      'Creates contextual summaries for text chunks to enhance search retrieval',
    instructions: () => {
      return `You create concise summaries of text chunks to improve search retrieval. Your only job is to summarize the given chunk within its document context.

TASK: Generate a brief summary (30-50 words) of the chunk that captures its key points and role in the larger document.

GUIDELINES:
- Focus on the main ideas and key information in the chunk
- Consider how the chunk fits into the complete document
- Identify the chunk's purpose or role (introduction, data, conclusion, etc.)
- Use descriptive, neutral language
- Make the summary useful for search and retrieval
- Different content types need different approaches:
  * "message": Focus on communication content and context
  * "page": Identify document structure and main topics
  * "record": Describe the type of data and key fields
  * Other types: Adapt summary to content purpose

OUTPUT: Provide only the summary with no additional text or explanations.`;
    },
    model: () => ModelConfig.forIntentRecognition(),
  });
};

export const AgentConfig = {
  INTENT_AGENT: 'intent-classifier',
  QUERY_AGENT: 'query-optimizer',
  ANSWER_AGENT: 'answer-generator',
  RERANK_AGENT: 'relevance-scorer',
  CHUNK_ENRICHMENT_AGENT: 'chunk-enrichment',
} as const;
