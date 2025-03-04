import { Document } from '@langchain/core/documents';
import { Annotation } from '@langchain/langgraph';
import {
  RerankedDocuments,
  CitedAnswer,
  DatabaseFilterResult,
  RewrittenQuery,
} from './llm';
import { SelectNode } from '@/data/schema';

export type Citation = {
  sourceId: string;
  quote: string;
};

export type RerankedContextItem = {
  index: number;
  score: number;
  type: string;
  sourceId: string;
};

export type DatabaseFilter = {
  databaseId: string;
  filters: any[];
};

export type DatabaseFilters = {
  shouldFilter: boolean;
  filters: DatabaseFilter[];
};

export type DatabaseContextItem = {
  id: string;
  name: string;
  fields: Record<string, { type: string; name: string }>;
  sampleRecords: any[];
};

export type UserDetails = {
  name: string;
  email: string;
};

export type AssistantInput = {
  userInput: string;
  workspaceId: string;
  userId: string;
  userDetails: UserDetails;
  parentMessageId: string;
  currentMessageId: string;
  originalMessage: SelectNode;
  selectedContextNodeIds?: string[];
};

export type AssistantResponse = {
  finalAnswer: string;
  citations: Citation[];
};

export const ResponseState = Annotation.Root({
  userInput: Annotation<string>(),
  workspaceId: Annotation<string>(),
  userId: Annotation<string>(),
  userDetails: Annotation<UserDetails>(),
  parentMessageId: Annotation<string>(),
  currentMessageId: Annotation<string>(),
  rewrittenQuery: Annotation<RewrittenQuery>(),
  contextDocuments: Annotation<Document[]>(),
  chatHistory: Annotation<Document[]>(),
  rerankedContext: Annotation<RerankedDocuments['rankings']>(),
  topContext: Annotation<Document[]>(),
  finalAnswer: Annotation<string>(),
  citations: Annotation<CitedAnswer['citations']>(),
  originalMessage: Annotation<any>(),
  intent: Annotation<'retrieve' | 'no_context'>(),
  databaseContext: Annotation<DatabaseContextItem[]>(),
  databaseFilters: Annotation<DatabaseFilterResult>(),
  selectedContextNodeIds: Annotation<string[]>(),
});

export type AssistantChainState = typeof ResponseState.State;
