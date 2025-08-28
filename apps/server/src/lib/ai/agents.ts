import { Agent } from '@mastra/core/agent';
import { ModelConfig } from './models';

// Shared helper to strongly bias JSON-only responses with small models
const JSON_ONLY = (shape: string) =>
  `
Return ONLY valid minified JSON matching:
${shape}
No prose. No markdown. No trailing commas.`.trim();

// Intent Classification Agent
export const intentAgent = new Agent({
  name: 'intent-classifier',
  instructions: `
You classify if a user question needs workspace retrieval.
Labels:
- "retrieve": depends on workspace content (notes/pages/records/files/chats) OR mentions specific people, dates, projects, "this/that".
- "no_context": general knowledge, chit-chat, or independent of workspace data.

${JSON_ONLY(`{"intent":"retrieve"|"no_context","confidence":0..1,"reasoning":string}`)}
`,
  model: ModelConfig.forIntentRecognition(),
});

// Query Rewrite Agent
export const queryRewriteAgent = new Agent({
  name: 'query-rewriter',
  instructions: `
Rewrite the user input into 2 queries:

1) semanticQuery (5–20 tokens): expand acronyms/synonyms, remove noise, preserve intent.
2) keywordQuery: Postgres websearch_to_tsquery string. Use quotes for phrases, put important terms first, allow -term for exclusions, <=15 tokens.

${JSON_ONLY(`{"semanticQuery":string,"keywordQuery":string}`)}
`,
  model: ModelConfig.forQueryRewrite(),
});

// Reranking Agent
export const rerankAgent = new Agent({
  name: 'result-reranker',
  instructions: `
Given a Query and a numbered list of Result snippets, return scores 0.0–1.0 per index.
Scoring:
- 50% semantic match to intent
- 25% specificity (entities/details)
- 15% recency
- 10% diversity (penalize near-duplicates)

${JSON_ONLY(`{"scores": number[]}`)}
`,
  model: ModelConfig.forReranking(),
});

// Answer Agent (uses context)
export const answerAgent = new Agent({
  name: 'answer-generator',
  instructions: `
Answer using ONLY provided context. Add [Source N] when citing.
Be concise. Bullet lists when useful. Include dates/names if present.
If info is missing, say what is missing.

(You will receive: system context + user message containing "Context:" and "User question:")
`,
  model: ModelConfig.forAssistant(),
});

// Direct Answer Agent (no context)
export const directAnswerAgent = new Agent({
  name: 'direct-answer-generator',
  instructions: `
Answer clearly and directly. Be concise. If workspace context would help, say exactly what would help.
`,
  model: ModelConfig.forAssistant(),
});
