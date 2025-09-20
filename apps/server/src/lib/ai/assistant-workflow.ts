// src/lib/ai/mastra/workflows/assistant.ts
import { z } from 'zod';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import {
  intentAgent,
  queryRewriteAgent,
  rerankAgent,
  answerAgent,
  directAnswerAgent,
} from './agents';

import {
  retrieveNodes,
  // types hidden in util: returns AIDocument[]
} from '@colanode/server/lib/ai/node-retrievals';
import { retrieveDocuments } from '@colanode/server/lib/ai/document-retrievals';

import {
  assistantWorkflowInputSchema as AssistantInput,
  assistantWorkflowOutputSchema as AssistantOutput,
  intentClassificationOutputSchema as IntentOut,
  queryRewriteOutputSchema as RewriteOut,
  rankedResultsOutputSchema as RankedOut,
} from '@colanode/server/types/ai';

// Local helper types and composed schemas to avoid relying on step.outputSchema.merge
type SearchResultItem = {
  content: string;
  sourceId: string;
  score: number;
  type: string;
  metadata: Array<Record<string, any>>;
};

type RankedItem = {
  content: string;
  sourceId: string;
  relevanceScore: number;
  type: string;
  metadata: Array<Record<string, any>>;
};

const ClassifiedInputSchema = AssistantInput.extend({
  intent: z.enum(['no_context', 'retrieve']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

const RewriteSchema = ClassifiedInputSchema.extend({
  rewrittenQuery: RewriteOut, // { semanticQueries, keywordQuery?, originalQuery, intent }
});

const HybridResultsSchema = RewriteSchema.extend({
  results: z.array(
    z.object({
      content: z.string(),
      sourceId: z.string(),
      score: z.number(),
      type: z.string(),
      metadata: z.array(z.record(z.string(), z.any())),
    })
  ),
});

const RerankedSchema = HybridResultsSchema.extend({
  ranked: z.array(
    z.object({
      content: z.string(),
      sourceId: z.string(),
      relevanceScore: z.number(),
      type: z.string(),
      metadata: z.array(z.record(z.string(), z.any())),
    })
  ),
  topContext: z.string(),
});

// ---------- step: classify intent ----------
const classifyIntentStep = createStep({
  id: 'classify-intent',
  description: 'Classify whether we need workspace retrieval.',
  inputSchema: AssistantInput as any,
  outputSchema: ClassifiedInputSchema as any,
  async execute({ inputData }) {
    const prompt = `
Classify this user question: "${inputData.userInput}"

Respond with JSON in this exact format:
{
  "intent": "no_context" or "retrieve",
  "confidence": 0.8,
  "reasoning": "brief explanation"
}
`.trim();

    const res = await intentAgent.generateVNext(prompt);
    let parsed: z.infer<typeof IntentOut>;

    try {
      const raw = JSON.parse(res.text);
      parsed = IntentOut.parse({
        intent: raw.intent,
        confidence: raw.confidence,
        reasoning: raw.reasoning,
        originalInput: inputData.userInput,
      });
    } catch {
      // fail-safe default
      parsed = {
        intent: 'no_context',
        confidence: 0.5,
        reasoning: 'Fallback: parse error',
        originalInput: inputData.userInput,
      };
    }

    return {
      ...inputData,
      intent: parsed.intent,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  },
});

// ---------- step: rewrite query (only for retrieve path) ----------
const rewriteQueryStep = createStep({
  id: 'rewrite-query',
  description:
    'Rewrite the user query into multiple semantic queries + optional keyword.',
  inputSchema: ClassifiedInputSchema as any,
  outputSchema: RewriteSchema as any,
  async execute({ inputData }) {
    const prompt = `
Rewrite this query for search: "${inputData.userInput}"

Respond with JSON in this exact format:
{
  "semanticQueries": [
    "natural language search query with expanded terms",
    "alternative phrasing capturing synonyms and intent"
  ],
  "keywordQuery": "postgres websearch_to_tsquery compatible string or empty string if not applicable"
}
`.trim();

    console.log('rewriting query');
    const res = await queryRewriteAgent.generateVNext(prompt);

    let semanticQueries: string[] = [inputData.userInput];
    let keywordQuery: string | undefined = undefined;
    try {
      const raw = JSON.parse(res.text);
      if (
        Array.isArray(raw.semanticQueries) &&
        raw.semanticQueries.length > 0
      ) {
        semanticQueries = raw.semanticQueries.filter(
          (s: any) => typeof s === 'string' && s.trim().length > 0
        );
      } else if (
        typeof raw.semanticQuery === 'string' &&
        raw.semanticQuery.trim().length > 0
      ) {
        // backward compatibility if the model returns a single semanticQuery
        semanticQueries = [raw.semanticQuery];
      }
      if (
        typeof raw.keywordQuery === 'string' &&
        raw.keywordQuery.trim().length > 0
      ) {
        keywordQuery = raw.keywordQuery;
      }
    } catch {
      // best-effort fallback – use original
    }

    return {
      ...inputData,
      rewrittenQuery: {
        semanticQueries,
        keywordQuery,
        originalQuery: inputData.userInput,
        intent: 'retrieve',
      },
    };
  },
});

// ---------- step: hybrid search (nodes + docs) ----------
const hybridSearchStep = createStep({
  id: 'hybrid-search',
  description: 'Hybrid vector + keyword search across nodes and documents.',
  inputSchema: RewriteSchema as any,
  outputSchema: HybridResultsSchema as any,
  async execute({ inputData }) {
    const { rewrittenQuery, workspaceId, userId, selectedContextNodeIds } =
      inputData;

    const [nodeResults, docResults] = await Promise.all([
      retrieveNodes(
        rewrittenQuery,
        workspaceId,
        userId,
        20,
        selectedContextNodeIds
      ),
      retrieveDocuments(
        rewrittenQuery,
        workspaceId,
        userId,
        20,
        selectedContextNodeIds
      ),
    ]);

    // unify to the step’s output shape the same way your current ai-workflow does
    const merged: SearchResultItem[] = [...nodeResults, ...docResults]
      .slice(0, 20)
      .map((md: any): SearchResultItem => {
        const meta = Array.isArray(md.metadata) ? (md.metadata[0] ?? {}) : {};
        return {
          content: md.text || '',
          type: meta.type ?? 'document',
          sourceId: `${md.id}:${meta.chunkIndex ?? 0}`,
          score: md.score ?? 0,
          metadata: [meta] as Array<Record<string, any>>,
        };
      });

    return { ...inputData, results: merged };
  },
});

// ---------- step: rerank ----------
const rerankStep = createStep({
  id: 'rerank',
  description:
    'Rerank results for semantic relevance, specificity, recency, diversity.',
  inputSchema: HybridResultsSchema as any,
  outputSchema: RerankedSchema as any,
  async execute({ inputData }) {
    if (!inputData.results?.length) {
      return {
        ...inputData,
        ranked: [],
        topContext: '',
      };
    }

    const preview = inputData.results
      .map(
        (it: SearchResultItem, i: number) =>
          `[${i}] ${String(it.content).slice(0, 300)}`
      )
      .join('\n\n');

    console.log('reranking');

    const scoreJson = await rerankAgent.generateVNext(
      `
Query: "${inputData.userInput}"
Score each result from 0.0–1.0 for relevance.

Respond with JSON in this exact format:
{ "scores": [0.9, 0.7, 0.5, ...] }

Results:
${preview}
`.trim()
    );
    console.log('reranking', scoreJson.text);
    let scores: number[] = [];
    try {
      scores = JSON.parse(scoreJson.text).scores ?? [];
    } catch {
      scores = inputData.results.map(() => 0.5);
    }

    const ranked: RankedItem[] = (inputData.results as SearchResultItem[])
      .map(
        (it: SearchResultItem, i: number): RankedItem => ({
          content: it.content,
          sourceId: it.sourceId,
          relevanceScore: scores[i] ?? 0.5,
          type: it.type,
          metadata: it.metadata,
        })
      )
      .sort(
        (a: RankedItem, b: RankedItem) => b.relevanceScore - a.relevanceScore
      )
      .slice(0, 20);

    const topContext = ranked
      .slice(0, 10)
      .map(
        (r: RankedItem, i: number) => `[Source ${i + 1}] ${String(r.content)}`
      )
      .join('\n\n');

    return { ...inputData, ranked, topContext };
  },
});

// ---------- step: answer with context ----------
const answerWithContextStep = createStep({
  id: 'answer-with-context',
  description: 'Answer using top context and generate citations.',
  inputSchema: RerankedSchema as any,
  outputSchema: AssistantOutput as any,
  async execute({ inputData }) {
    if (!inputData.ranked?.length) {
      return {
        finalAnswer:
          "I couldn't find relevant workspace context for that. Try rephrasing or selecting different context.",
        citations: [],
        searchPerformed: true,
        processingTimeMs: undefined,
      };
    }

    console.log('answering with context');
    const answer = await answerAgent.generateVNext([
      {
        role: 'system',
        content: `You are a precise, helpful assistant for the ${inputData.workspaceName} workspace. User: ${inputData.userDetails.name}.`,
      },
      {
        role: 'user',
        content: `
User question: ${inputData.userInput}
Use only the context below. Prefer bullet points for lists. Include dates and names when available.

Context:
${inputData.topContext}
        `.trim(),
      },
    ]);
    console.log('answering with context', answer.text);
    // collect citations
    const used = new Set<number>();
    for (const m of answer.text.matchAll(/\[Source\s+(\d+)\]/gi)) {
      used.add(Number(m[1]));
    }
    const citations = Array.from(used)
      .slice(0, 10)
      .map((i) => {
        const r = inputData.ranked[i - 1];
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

    return {
      finalAnswer: answer.text,
      citations,
      searchPerformed: true,
    };
  },
});

// ---------- step: direct answer (no retrieval) ----------
const directAnswerStep = createStep({
  id: 'direct-answer',
  description: 'Answer directly without workspace retrieval.',
  inputSchema: ClassifiedInputSchema as any,
  outputSchema: AssistantOutput as any,
  async execute({ inputData }) {
    const res = await directAnswerAgent.generateVNext([
      {
        role: 'system',
        content: `You are a precise, helpful assistant. Keep answers concise but complete. You are working in the ${inputData.workspaceName} workspace. User: ${inputData.userDetails.name}.`,
      },
      {
        role: 'user',
        content: `Answer the question clearly. If you need extra context from the workspace, say what would help.
Question: ${inputData.userInput}`,
      },
    ]);

    return {
      finalAnswer: res.text,
      citations: [],
      searchPerformed: false,
    };
  },
});

// ---------- compose workflow ----------
export const assistantWorkflow = createWorkflow({
  id: 'assistant-workflow',
  description: 'Deterministic assistant pipeline for Colanode (Mastra).',
  inputSchema: AssistantInput as any,
  outputSchema: AssistantOutput as any,
})
  .then(classifyIntentStep)
  .branch([
    // RETRIEVE PATH
    [
      async ({ inputData }) => inputData.intent === 'retrieve',
      createWorkflow({
        id: 'retrieve-subflow',
        description: 'Rewrite → Hybrid Search → Rerank → Answer',
        inputSchema: ClassifiedInputSchema as any,
        outputSchema: AssistantOutput as any,
      })
        .then(rewriteQueryStep)
        .then(hybridSearchStep)
        .then(rerankStep)
        .then(answerWithContextStep)
        .commit(),
    ],
    // NO-CONTEXT PATH
    [
      async ({ inputData }) => inputData.intent === 'no_context',
      createWorkflow({
        id: 'no-context-subflow',
        description: 'Direct answer path',
        inputSchema: ClassifiedInputSchema as any,
        outputSchema: AssistantOutput as any,
      })
        .then(directAnswerStep)
        .commit(),
    ],
  ])
  .commit();
