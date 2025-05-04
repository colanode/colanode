import { StateGraph } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';
import { CallbackHandler } from 'langfuse-langchain';
import {
  DatabaseAttributes,
  getNodeModel,
  RecordAttributes,
} from '@colanode/core';

import { database } from '@/data/database';
import { config } from '@/lib/config';
import { fetchNode, fetchNodeDescendants } from '@/lib/nodes';
import {
  rewriteQuery,
  assessUserIntent,
  generateNoContextAnswer,
  rerankDocuments,
  generateFinalAnswer,
  generateDatabaseFilters,
} from '@/lib/ai/llms';
import { retrieveNodes } from '@/lib/ai/node-retrievals';
import { retrieveDocuments } from '@/lib/ai/document-retrievals';
import { retrieveByFilters } from '@/lib/records';
import {
  AssistantChainState,
  ResponseState,
  DatabaseFilters,
  DatabaseContextItem,
  AssistantResponse,
  AssistantInput,
} from '@/types/assistant';
import { fetchMetadataForContextItems } from '@/lib/ai/metadata';
import { SelectNode } from '@/data/schema';
import {
  formatChatHistory,
  formatContextDocuments,
  selectTopContext,
  formatMetadataForPrompt,
} from '@/lib/ai/utils';

const generateRewrittenQuery = async (state: AssistantChainState) => {
  const rewrittenQuery = await rewriteQuery(state.userInput);
  return { rewrittenQuery };
};

const assessIntent = async (state: AssistantChainState) => {
  const chatHistory = formatChatHistory(state.chatHistory);
  const intent = await assessUserIntent(state.userInput, chatHistory);
  return { intent };
};

const generateNoContextResponse = async (state: AssistantChainState) => {
  const chatHistory = formatChatHistory(state.chatHistory);
  const finalAnswer = await generateNoContextAnswer(
    state.userInput,
    chatHistory
  );
  return { finalAnswer };
};

const fetchContextDocuments = async (state: AssistantChainState) => {
  if (!config.ai.enabled) {
    return { contextDocuments: [] };
  }

  const [nodeResults, documentResults] = await Promise.all([
    retrieveNodes(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId,
      config.ai.retrieval.hybridSearch.maxResults,
      state.selectedContextNodeIds
    ),
    retrieveDocuments(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId,
      config.ai.retrieval.hybridSearch.maxResults,
      state.selectedContextNodeIds
    ),
  ]);
  let databaseResults: Document[] = [];
  if (state.databaseFilters.shouldFilter) {
    const filteredRecords = await Promise.all(
      state.databaseFilters.filters.map(async (filter) => {
        const records = await retrieveByFilters(
          filter.databaseId,
          state.workspaceId,
          state.userId,
          { filters: filter.filters, sorts: [], page: 1, count: 10 }
        );
        const dbNode = await fetchNode(filter.databaseId);
        if (!dbNode || dbNode.type !== 'database') return [];
        return records.map((record) => {
          const fields = Object.entries(
            (record.attributes as RecordAttributes).fields || {}
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          const content = `Database Record from ${dbNode.type === 'database' ? (dbNode.attributes as DatabaseAttributes).name || 'Database' : 'Database'}:\n${fields}`;
          return new Document({
            pageContent: content,
            metadata: {
              id: record.id,
              type: 'record',
              createdAt: record.created_at,
              author: record.created_by,
              databaseId: filter.databaseId,
            },
          });
        });
      })
    );
    databaseResults = filteredRecords.flat();
  }
  return {
    contextDocuments: [...nodeResults, ...documentResults, ...databaseResults],
  };
};

const fetchChatHistory = async (state: AssistantChainState) => {
  const messages = await database
    .selectFrom('nodes')
    .where('parent_id', '=', state.parentMessageId)
    .where('type', '=', 'message')
    .where('id', '!=', state.currentMessageId)
    .where('workspace_id', '=', state.workspaceId)
    .orderBy('created_at', 'asc')
    .selectAll()
    .execute();
  const chatHistory = messages.map((message) => {
    const isAI = message.created_by === 'colanode_ai';
    const extracted = (message &&
      message.attributes &&
      getNodeModel(message.type)?.extractText(
        message.id,
        message.attributes
      )) || { attributes: '' };
    const text = extracted.attributes;
    return new Document({
      pageContent: text || '',
      metadata: {
        id: message.id,
        type: 'message',
        createdAt: message.created_at,
        author: message.created_by,
        authorName: isAI ? 'Colanode AI' : 'User',
      },
    });
  });

  return { chatHistory };
};

const rerankContextDocuments = async (state: AssistantChainState) => {
  const docsForRerank = state.contextDocuments.map((doc) => ({
    content: doc.pageContent,
    type: doc.metadata.type,
    sourceId: doc.metadata.id,
  }));
  const rerankedContext = await rerankDocuments(
    docsForRerank,
    state.rewrittenQuery.semanticQuery
  );

  return { rerankedContext };
};

const selectRelevantDocuments = async (state: AssistantChainState) => {
  if (state.rerankedContext.length === 0) {
    return { topContext: [] };
  }

  const maxContext = 10;
  const topContext = selectTopContext(
    state.rerankedContext,
    maxContext,
    state.contextDocuments
  );

  const contextItemsWithType = topContext.map((doc) => ({
    id: doc.metadata.id,
    type: doc.metadata.type,
  }));

  const metadata = await fetchMetadataForContextItems(contextItemsWithType);

  topContext.forEach((doc) => {
    const id = doc.metadata.id;
    if (metadata[id]) {
      doc.metadata.formattedMetadata = formatMetadataForPrompt(metadata[id]);
    }
  });

  return { topContext };
};

const fetchWorkspaceDetails = async (workspaceId: string) => {
  return database
    .selectFrom('workspaces')
    .where('id', '=', workspaceId)
    .select(['name', 'id'])
    .executeTakeFirst();
};

const generateResponse = async (state: AssistantChainState) => {
  const workspace = await fetchWorkspaceDetails(state.workspaceId);
  const formattedChatHistory = formatChatHistory(state.chatHistory);
  const formattedContext = formatContextDocuments(state.topContext);

  const result = await generateFinalAnswer({
    currentTimestamp: new Date().toISOString(),
    workspaceName: workspace?.name || state.workspaceId,
    userName: state.userDetails.name,
    userEmail: state.userDetails.email,
    formattedChatHistory,
    formattedMessages: '',
    formattedDocuments: formattedContext,
    question: state.userInput,
  });

  return { finalAnswer: result.answer, citations: result.citations };
};

const fetchDatabaseContext = async (state: AssistantChainState) => {
  const databases = await database
    .selectFrom('nodes as n')
    .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
    .where('n.type', '=', 'database')
    .where('n.workspace_id', '=', state.workspaceId)
    .where('c.collaborator_id', '=', state.userId)
    .where('c.deleted_at', 'is', null)
    .selectAll()
    .execute();

  const databaseContext: DatabaseContextItem[] = await Promise.all(
    databases.map(async (db) => {
      const dbNode = db as SelectNode;
      const sampleRecords = await retrieveByFilters(
        db.id,
        state.workspaceId,
        state.userId,
        { filters: [], sorts: [], page: 1, count: 5 }
      );
      const dbAttrs = dbNode.attributes as DatabaseAttributes;
      const fields = dbAttrs.fields || {};
      const formattedFields = Object.entries(fields).reduce(
        (acc, [id, field]) => ({
          ...acc,
          [id]: {
            type: (field as { type: string; name: string }).type,
            name: (field as { type: string; name: string }).name,
          },
        }),
        {}
      );

      return {
        id: db.id,
        name: dbAttrs.name || 'Untitled Database',
        fields: formattedFields,
        sampleRecords,
      };
    })
  );

  return { databaseContext };
};

const generateDatabaseFilterAttributes = async (state: AssistantChainState) => {
  if (state.intent === 'no_context' || !state.databaseContext.length) {
    return {
      databaseFilters: { shouldFilter: false, filters: [] } as DatabaseFilters,
    };
  }
  const databaseFilters = await generateDatabaseFilters({
    query: state.userInput,
    databases: state.databaseContext,
  });

  return { databaseFilters };
};

const assistantResponseChain = new StateGraph(ResponseState)
  .addNode('generateRewrittenQuery', generateRewrittenQuery)
  .addNode('fetchContextDocuments', fetchContextDocuments)
  .addNode('fetchChatHistory', fetchChatHistory)
  .addNode('rerankContextDocuments', rerankContextDocuments)
  .addNode('selectRelevantDocuments', selectRelevantDocuments)
  .addNode('generateResponse', generateResponse)
  .addNode('assessIntent', assessIntent)
  .addNode('generateNoContextResponse', generateNoContextResponse)
  .addNode('fetchDatabaseContext', fetchDatabaseContext)
  .addNode('generateDatabaseFilterAttributes', generateDatabaseFilterAttributes)
  .addEdge('__start__', 'fetchChatHistory')
  .addEdge('fetchChatHistory', 'assessIntent')
  .addConditionalEdges('assessIntent', (state) =>
    state.intent === 'no_context'
      ? 'generateNoContextResponse'
      : 'generateRewrittenQuery'
  )
  .addEdge('generateRewrittenQuery', 'fetchContextDocuments')
  .addEdge('fetchContextDocuments', 'rerankContextDocuments')
  .addEdge('rerankContextDocuments', 'selectRelevantDocuments')
  .addEdge('selectRelevantDocuments', 'generateResponse')
  .addEdge('generateResponse', '__end__')
  .addEdge('generateNoContextResponse', '__end__')
  .compile();

const langfuseCallback =
  config.ai.enabled && config.ai.langfuse.enabled
    ? new CallbackHandler({
        publicKey: config.ai.langfuse.publicKey,
        secretKey: config.ai.langfuse.secretKey,
        baseUrl: config.ai.langfuse.baseUrl,
      })
    : undefined;

const getFullContextNodeIds = async (
  selectedIds: string[]
): Promise<string[]> => {
  const fullSet = new Set<string>();
  for (const id of selectedIds) {
    fullSet.add(id);
    try {
      const descendants = await fetchNodeDescendants(id);
      descendants.forEach((descId) => fullSet.add(descId));
    } catch (error) {
      console.error(`Error fetching descendants for node ${id}:`, error);
    }
  }

  return Array.from(fullSet);
};

export const runAssistantResponseChain = async (
  input: AssistantInput
): Promise<AssistantResponse> => {
  let fullContextNodeIds: string[] = [];
  if (input.selectedContextNodeIds && input.selectedContextNodeIds.length > 0) {
    fullContextNodeIds = await getFullContextNodeIds(
      input.selectedContextNodeIds
    );
  }

  const chainInput = {
    ...input,
    selectedContextNodeIds: fullContextNodeIds,
    intent: 'retrieve' as const,
    databaseFilters: { shouldFilter: false, filters: [] },
  };

  const callbacks = langfuseCallback ? [langfuseCallback] : undefined;

  const result = await assistantResponseChain.invoke(chainInput, {
    callbacks,
  });
  return { finalAnswer: result.finalAnswer, citations: result.citations };
};
