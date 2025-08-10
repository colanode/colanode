import { MDocument } from '@mastra/rag';
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
  const ageInDays =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
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
    ? (result.score / maxScore) * weight
    : ((maxScore - result.score) / maxScore) * weight;

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

const createDocumentFromResult = (
  result: SearchResult & { finalScore: number },
  authorMap: Map<string, { id: string; name: string | null }>
): MDocument => {
  const author = result.createdBy ? authorMap.get(result.createdBy) : null;
  const summaryPart = (result.summary ?? '').trim();
  const content = summaryPart
    ? `${summaryPart}\n\n${result.text}`
    : result.text;

  const doc = MDocument.fromText(content, {
    id: result.id,
    score: result.finalScore,
    createdAt: result.createdAt,

    type: (result as any).sourceType ?? 'document',
    chunkIndex: result.chunkIndex,
    author: author ? { id: author.id, name: author.name || 'Unknown' } : null,
  });

  return doc;
};

export const combineAndScoreSearchResults = (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  semanticSearchWeight: number,
  keywordSearchWeight: number,
  authorMap: Map<string, { id: string; name: string | null }>
): Promise<MDocument[]> => {
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
      .map((result) => createDocumentFromResult(result, authorMap))
  );
};
