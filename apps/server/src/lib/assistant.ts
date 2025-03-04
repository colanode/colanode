import { StateGraph } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';
import { CallbackHandler } from 'langfuse-langchain';
import {
  DatabaseAttributes,
  getNodeModel,
  RecordAttributes,
} from '@colanode/core';

import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { fetchNode, fetchNodeDescendants } from '@/lib/nodes';
import {
  rewriteQuery,
  assessUserIntent,
  generateNoContextAnswer,
  rerankDocuments,
  generateFinalAnswer,
  generateDatabaseFilters,
} from '@/services/llm-service';
import { nodeRetrievalService } from '@/services/node-retrieval-service';
import { documentRetrievalService } from '@/services/document-retrieval-service';
import { recordsRetrievalService } from '@/services/records-retrieval-service';
import {
  AssistantChainState,
  ResponseState,
  DatabaseFilters,
  DatabaseContextItem,
  AssistantResponse,
  AssistantInput,
} from '@/types/assistant';
import { fetchMetadataForContextItems } from '@/lib/metadata';
import { SelectNode } from '@/data/schema';
import {
  formatChatHistory,
  formatContextDocuments,
  selectTopContext,
  formatMetadataForPrompt,
} from '@/lib/ai-utils';

async function generateRewrittenQuery(state: AssistantChainState) {
  const rewrittenQuery = await rewriteQuery(state.userInput);
  return { rewrittenQuery };
}

async function assessIntent(state: AssistantChainState) {
  const chatHistory = formatChatHistory(state.chatHistory);
  const intent = await assessUserIntent(state.userInput, chatHistory);
  return { intent };
}

async function generateNoContextResponse(state: AssistantChainState) {
  const chatHistory = formatChatHistory(state.chatHistory);
  const finalAnswer = await generateNoContextAnswer(
    state.userInput,
    chatHistory
  );
  return { finalAnswer };
}

async function fetchContextDocuments(state: AssistantChainState) {
  const [nodeResults, documentResults] = await Promise.all([
    nodeRetrievalService.retrieve(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId,
      configuration.ai.retrieval.hybridSearch.maxResults,
      state.selectedContextNodeIds
    ),
    documentRetrievalService.retrieve(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId,
      configuration.ai.retrieval.hybridSearch.maxResults,
      state.selectedContextNodeIds
    ),
  ]);
  let databaseResults: Document[] = [];
  if (state.databaseFilters.shouldFilter) {
    const filteredRecords = await Promise.all(
      state.databaseFilters.filters.map(async (filter) => {
        const records = await recordsRetrievalService.retrieveByFilters(
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
}

async function fetchChatHistory(state: AssistantChainState) {
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
      getNodeModel(message.type)?.extractNodeText(
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
}

async function rerankContextDocuments(state: AssistantChainState) {
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
}

async function selectRelevantDocuments(state: AssistantChainState) {
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
}

async function fetchWorkspaceDetails(workspaceId: string) {
  return database
    .selectFrom('workspaces')
    .where('id', '=', workspaceId)
    .select(['name', 'id'])
    .executeTakeFirst();
}

async function generateResponse(state: AssistantChainState) {
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
}

async function fetchDatabaseContext(state: AssistantChainState) {
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
      const sampleRecords = await recordsRetrievalService.retrieveByFilters(
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
}

async function generateDatabaseFilterAttributes(state: AssistantChainState) {
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
}

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

const langfuseCallback = configuration.ai.langfuse.enabled
  ? new CallbackHandler({
      publicKey: configuration.ai.langfuse.publicKey,
      secretKey: configuration.ai.langfuse.secretKey,
      baseUrl: configuration.ai.langfuse.baseUrl,
    })
  : undefined;

async function getFullContextNodeIds(selectedIds: string[]): Promise<string[]> {
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
}

export async function runAssistantResponseChain(
  input: AssistantInput
): Promise<AssistantResponse> {
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
}
