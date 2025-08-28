import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import {
  intentAgent,
  queryRewriteAgent,
  rerankAgent,
  answerAgent,
  directAnswerAgent,
} from './agents';
import { assistantWorkflow } from './assistant-workflow';

export const mastra = new Mastra({
  storage: new LibSQLStore({ url: ':memory:' }),
  agents: {
    'intent-classifier': intentAgent,
    'query-rewriter': queryRewriteAgent,
    'result-reranker': rerankAgent,
    'answer-generator': answerAgent,
    'direct-answer-generator': directAnswerAgent,
  },
  workflows: {
    assistantWorkflow, // ← register it
  },
});

export * from './agents';
