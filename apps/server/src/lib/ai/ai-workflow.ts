import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { ModelConfig } from './ai-models';
import { retrieveNodes } from '@colanode/server/lib/ai/node-retrievals';
import { retrieveDocuments } from '@colanode/server/lib/ai/document-retrievals';
import {
  AssistantWorkflowInput,
  AssistantWorkflowOutput,
  HybridSearchArgs,
} from '@colanode/server/types/ai';

export async function runAssistantWorkflow(
  input: AssistantWorkflowInput
): Promise<AssistantWorkflowOutput> {
  const intent = await classifyIntent(input.userInput);

  if (intent.intent === 'retrieve') {
    const rewrites = await rewriteQuery(input.userInput);

    const { results } = await hybridSearch({
      semanticQuery: rewrites.semanticQuery,
      keywordQuery: rewrites.keywordQuery,
      workspaceId: input.workspaceId,
      userId: input.userId,
      maxResults: 20,
      selectedContextNodeIds: input.selectedContextNodeIds,
    });

    const combined = combineResults(results);

    if (combined.length === 0) {
      return {
        finalAnswer:
          "I couldn't find relevant workspace context for that. Try rephrasing or selecting different context.",
        citations: [],
        searchPerformed: true,
      };
    }

    const ranked = await rerankLLM(input.userInput, combined);

    const { answer, citations } = await answerWithContext(
      input.userInput,
      ranked,
      {
        workspaceName: input.workspaceName,
        userName: input.userDetails.name,
      }
    );

    return { finalAnswer: answer, citations, searchPerformed: true };
  }

  const answer = await answerDirect(input.userInput, {
    workspaceName: input.workspaceName,
    userName: input.userDetails.name,
  });

  return { finalAnswer: answer, citations: [], searchPerformed: false };
}

async function classifyIntent(query: string) {
  const schema = z.object({
    intent: z.enum(['no_context', 'retrieve']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  });

  const { object } = await generateObject({
    model: ModelConfig.forIntentRecognition(),
    schema,
    prompt: `
Decide if the user question requires searching workspace context.

Return JSON { "intent": "retrieve"|"no_context", "confidence": 0..1, "reasoning": "<one short sentence>" }.

Guidelines:
- "retrieve" if the answer likely depends on workspace content (notes, pages, records, files, chats) OR references specific people, dates, projects, or "this/that" items.
- "no_context" for general knowledge, chit-chat, or requests that don't reference workspace data.

Question: "${query}"
`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'intent-classification',
      mxetadata: { stage: 'intent', userQuery: query },
    },
  });

  return object;
}

async function rewriteQuery(original: string) {
  const schema = z.object({
    semanticQuery: z.string(),
    keywordQuery: z.string(),
  });

  const { object } = await generateObject({
    model: ModelConfig.forQueryRewrite(),
    schema,
    prompt: `
Rewrite the user's input into two queries:

1) "semanticQuery": A short natural-language search query (5–20 tokens), with expanded entities, acronyms, and likely synonyms. Drop punctuation and noise.
2) "keywordQuery": A Postgres websearch_to_tsquery string with:
   - quoted phrases for exact matches
   - important terms first
   - optional synonyms after OR
   - minus terms if the user excluded something
   - keep it <= 15 tokens

Example:
Input: "oncall runbook for payments db; not the legacy doc"
semanticQuery: "payments database oncall runbook escalation procedures current"
keywordQuery: "\"payments database\" runbook escalation -legacy"

Input: "${original}"
Return JSON with both fields only.
`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'query-rewrite',
      metadata: { stage: 'rewrite', original },
    },
  });

  return object;
}

async function hybridSearch(args: HybridSearchArgs) {
  const {
    semanticQuery,
    keywordQuery,
    workspaceId,
    userId,
    maxResults = 20,
    selectedContextNodeIds = [],
  } = args;

  const [nodeResults, documentResults] = await Promise.all([
    retrieveNodes(
      {
        semanticQuery,
        keywordQuery,
        originalQuery: semanticQuery || keywordQuery,
        intent: 'retrieve',
      },
      workspaceId,
      userId,
      maxResults,
      selectedContextNodeIds
    ),
    retrieveDocuments(
      {
        semanticQuery,
        keywordQuery,
        originalQuery: semanticQuery || keywordQuery,
        intent: 'retrieve',
      },
      workspaceId,
      userId,
      maxResults,
      selectedContextNodeIds
    ),
  ]);

  const merged = [...nodeResults, ...documentResults]
    .slice(0, maxResults)
    .map((md: any) => {
      const meta = Array.isArray(md.metadata) ? (md.metadata[0] ?? {}) : {};
      return {
        content: md.text || '',
        type: meta.type ?? 'document',
        sourceId: `${md.id}:${meta.chunkIndex ?? 0}`,
        score: md.score ?? 0,
        metadata: meta,
      };
    });

  return {
    results: merged,
    totalFound: merged.length,
    searchType: 'hybrid' as const,
  };
}

function combineResults(results: any[]) {
  const unique = new Map<string, any>();
  results.forEach((r, i) => {
    const key = r.sourceId as string;
    if (!unique.has(key)) {
      const positionScore = 1 / (i + 1);
      // Remove recency boost here - it's already applied in combineAndScoreSearchResults
      const combined = r.score * 0.8 + positionScore * 0.2;
      unique.set(key, { ...r, score: Math.min(1, combined) });
    }
  });
  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

async function rerankLLM(query: string, items: any[]) {
  const schema = z.object({ scores: z.array(z.number().min(0).max(1)) });

  const preview = items
    .map((it, i) => `[${i}] ${String(it.content).slice(0, 300)}`)
    .join('\n\n');

  const { object } = await generateObject({
    model: ModelConfig.forReranking(),
    schema,
    prompt: `
Query: "${query}"
Score each result from 0.0–1.0 for relevance.

Scoring rubric:
- 50% Semantic match to the query intent.
- 25% Specificity (concrete details, matches entities).
- 15% Recency (newer is better).
- 10% Diversity (penalize near-duplicates).

You may use metadata if present: type, createdAt, author, chunkIndex.
Return only JSON: { "scores": [number...] } in the same order as provided.

Results:
${preview}
`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'rerank',
      metadata: { stage: 'rerank', itemCount: items.length },
    },
  });

  return items
    .map((it, i) => ({
      content: it.content,
      sourceId: it.sourceId,
      relevanceScore: object.scores[i] ?? 0.5,
      type: it.type,
      metadata: it.metadata,
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20);
}

async function answerWithContext(
  userQuery: string,
  ranked: any[],
  { workspaceName, userName }: { workspaceName: string; userName: string }
) {
  const context = ranked
    .slice(0, 10)
    .map((r, i) => `[Source ${i + 1}] ${String(r.content)}`)
    .join('\n\n');

  const { text } = await generateText({
    model: ModelConfig.forAssistant(),
    system: `You are a precise, helpful assistant for the ${workspaceName} workspace. User: ${userName}. When you state a fact from context, add [Source N]. If unsure, say so briefly.`,
    prompt: `
User question: ${userQuery}

Use only the context below. If the answer requires assumptions not supported by the context, say what is missing.
Prefer bullet points for lists. Include dates and names when available.

Context:
${context}
`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'answer-with-context',
      metadata: {
        stage: 'answer',
        withContext: true,
        contextItems: ranked.length,
      },
    },
  });

  const used = new Set<number>();
  for (const m of text.matchAll(/\[Source\s+(\d+)\]/gi)) used.add(Number(m[1]));
  const citations = Array.from(used)
    .slice(0, 10)
    .map((i) => {
      const r = ranked[i - 1];
      return r
        ? {
            sourceId: r.sourceId,
            quote:
              String(r.content).slice(0, 200).trim() +
              (String(r.content).length > 200 ? '...' : ''),
          }
        : null;
    })
    .filter(Boolean) as { sourceId: string; quote: string }[];

  return { answer: text, citations };
}

async function answerDirect(
  userQuery: string,
  { workspaceName, userName }: { workspaceName: string; userName: string }
) {
  const { text } = await generateText({
    model: ModelConfig.forAssistant(),
    system: `You are a precise, helpful assistant. Keep answers concise but complete. You are working in the ${workspaceName} workspace. User: ${userName}.`,
    prompt: `Answer the question clearly. If you need extra context from the workspace, say what would help.
Question: ${userQuery}`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'answer-direct',
      metadata: { stage: 'answer', withContext: false },
    },
  });

  return text;
}
