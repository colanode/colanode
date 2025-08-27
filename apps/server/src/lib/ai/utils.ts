import ms from 'ms';
import { SearchResult } from '@colanode/server/types/retrieval';

export const formatDate = (date?: Date | null): string => {
  if (!date) return 'Unknown time';
  return new Date(date).toLocaleString();
};

export const calculateRecencyBoost = (
  createdAt: Date | undefined | null,
  halfLifeDays: number = 7,
  boostFactor: number = 0.2
): number => {
  if (!createdAt) return 1;
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / ms('1 day');
  return ageInDays <= halfLifeDays
    ? 1 + (1 - ageInDays / halfLifeDays) * boostFactor
    : 1;
};

export const createKey = (result: SearchResult): string => {
  return `${result.id}-${result.chunkIndex}`;
};

const processSearchResult = (
  result: SearchResult,
  combined: Map<string, SearchResult & { finalScore: number }>,
  maxScore: number,
  weight: number,
  isKeyword: boolean = false
) => {
  const key = createKey(result);
  const recencyBoost = calculateRecencyBoost(result.createdAt);
  const normalizedScore = isKeyword
    ? (result.score / maxScore) * weight // rank normalized
    : Math.max(0, Math.min(1, result.score)) * weight; // similarity already 0..1

  if (combined.has(key)) {
    const existing = combined.get(key)!;
    existing.finalScore += normalizedScore * recencyBoost;
  } else {
    combined.set(key, {
      ...result,
      finalScore: normalizedScore * recencyBoost,
    });
  }
};

export type AIDocument = {
  id: string;
  text: string;
  summary: string | null;
  score: number;
  metadata: Record<string, any>[];
};

export const combineAndScoreSearchResults = (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  semanticSearchWeight: number,
  keywordSearchWeight: number,
  authorMap: Map<string, { id: string; name: string | null }>
): Promise<AIDocument[]> => {
  const maxSemanticScore = Math.max(...semanticResults.map((r) => r.score), 1);
  const maxKeywordScore = Math.max(...keywordResults.map((r) => r.score), 1);

  const combined = new Map<string, SearchResult & { finalScore: number }>();

  semanticResults.forEach((result) =>
    processSearchResult(
      result,
      combined,
      maxSemanticScore,
      semanticSearchWeight
    )
  );
  keywordResults.forEach((result) =>
    processSearchResult(
      result,
      combined,
      maxKeywordScore,
      keywordSearchWeight,
      true
    )
  );

  return Promise.resolve(
    Array.from(combined.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((result) => {
        const author = result.createdBy
          ? authorMap.get(result.createdBy)
          : null;
        const type = (result as any).sourceType ?? 'document';
        const meta: Record<string, any> = {
          type,
          createdAt: result.createdAt ?? null,
          createdBy: result.createdBy ?? null,
          chunkIndex: result.chunkIndex,
        };
        if (author)
          meta.author = { id: author.id, name: author.name || 'Unknown' };
        return {
          id: result.id,
          text: result.text,
          summary: result.summary,
          score: result.finalScore,
          metadata: [meta],
        };
      })
  );
};
