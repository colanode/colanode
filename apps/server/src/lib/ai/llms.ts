import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { NodeType, RecordNode } from '@colanode/core';

import { config } from '@/lib/config';
import {
  rerankedDocumentsSchema,
  RerankedDocuments,
  citedAnswerSchema,
  CitedAnswer,
  databaseFilterSchema,
  DatabaseFilterResult,
  RewrittenQuery,
  rewrittenQuerySchema,
} from '@/types/llm';
import {
  queryRewritePrompt,
  summarizationPrompt,
  rerankPrompt,
  answerPrompt,
  intentRecognitionPrompt,
  noContextPrompt,
  databaseFilterPrompt,
  chunkSummarizationPrompt,
} from '@/lib/ai/prompts';

const getChatModel = (task: string): ChatOpenAI | ChatGoogleGenerativeAI => {
  if (!config.ai.enabled) {
    throw new Error('AI is disabled.');
  }

  const modelConfig = config.ai.models[task as keyof typeof config.ai.models];

  const providerConfig = config.ai.providers[modelConfig.provider];
  if (!providerConfig.enabled) {
    throw new Error(`${modelConfig.provider} provider is disabled.`);
  }

  switch (modelConfig.provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        openAIApiKey: providerConfig.apiKey,
      });
    case 'google':
      return new ChatGoogleGenerativeAI({
        model: modelConfig.modelName,
        temperature: modelConfig.temperature,
        apiKey: providerConfig.apiKey,
      });
    default:
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
  }
};

export const rewriteQuery = async (query: string): Promise<RewrittenQuery> => {
  const task = 'queryRewrite';
  const model = getChatModel(task).withStructuredOutput(rewrittenQuerySchema);
  return queryRewritePrompt.pipe(model).invoke({ query });
};

export const summarizeDocument = async (
  document: Document,
  query: string
): Promise<string> => {
  const task = 'summarization';
  const model = getChatModel(task);
  return summarizationPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ text: document.pageContent, query });
};

export const rerankDocuments = async (
  documents: { content: string; type: string; sourceId: string }[],
  query: string
): Promise<
  Array<{ index: number; score: number; type: string; sourceId: string }>
> => {
  const task = 'rerank';
  const model = getChatModel(task).withStructuredOutput(
    rerankedDocumentsSchema
  );
  const formattedContext = documents
    .map(
      (doc, idx) =>
        `${idx}. Type: ${doc.type}, Content: ${doc.content}, ID: ${doc.sourceId}\n`
    )
    .join('\n');
  const result = (await rerankPrompt
    .pipe(model)
    .invoke({ query, context: formattedContext })) as RerankedDocuments;
  return result.rankings;
};

export const generateFinalAnswer = async (promptArgs: {
  currentTimestamp: string;
  workspaceName: string;
  userName: string;
  userEmail: string;
  formattedChatHistory: string;
  formattedMessages: string;
  formattedDocuments: string;
  question: string;
}): Promise<{
  answer: string;
  citations: Array<{ sourceId: string; quote: string }>;
}> => {
  const task = 'response';
  const model = getChatModel(task).withStructuredOutput(citedAnswerSchema);
  return (await answerPrompt.pipe(model).invoke(promptArgs)) as CitedAnswer;
};

export const generateNoContextAnswer = async (
  query: string,
  chatHistory: string = ''
): Promise<string> => {
  const task = 'noContext';
  const model = getChatModel(task);
  return noContextPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
};

export const assessUserIntent = async (
  query: string,
  chatHistory: string
): Promise<'retrieve' | 'no_context'> => {
  const task = 'intentRecognition';
  const model = getChatModel(task);
  const result = await intentRecognitionPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
  return result.trim().toLowerCase() === 'no_context'
    ? 'no_context'
    : 'retrieve';
};

export const generateDatabaseFilters = async (args: {
  query: string;
  databases: Array<{
    id: string;
    name: string;
    fields: Record<string, { type: string; name: string }>;
    sampleRecords: RecordNode[];
  }>;
}): Promise<DatabaseFilterResult> => {
  const task = 'databaseFilter';
  const model = getChatModel(task).withStructuredOutput(databaseFilterSchema);
  const databasesInfo = args.databases
    .map(
      (db) => `
Database: ${db.name} (ID: ${db.id})
Fields:
${Object.entries(db.fields)
  .map(([id, field]) => `- ${field.name} (ID: ${id}, Type: ${field.type})`)
  .join('\n')}

Sample Records:
${db.sampleRecords
  .map(
    (record, i) =>
      `${i + 1}. ${Object.entries(record.attributes.fields)
        .map(([fieldId, value]) => `${db.fields[fieldId]?.name}: ${value}`)
        .join(', ')}`
  )
  .join('\n')}
`
    )
    .join('\n\n');

  return databaseFilterPrompt
    .pipe(model)
    .invoke({ query: args.query, databasesInfo });
};

export const enrichChunk = async (
  chunk: string,
  fullText: string = '',
  nodeType: NodeType
): Promise<string> => {
  const task = 'contextEnhancer';
  const model = getChatModel(task);

  return chunkSummarizationPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({
      chunk,
      fullText,
      nodeType,
    });
};
