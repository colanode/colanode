import { Document } from '@langchain/core/documents';

import { SearchResult } from '@/types/retrieval';
import { RerankedContextItem } from '@/types/assistant';
import { NodeMetadata, DocumentMetadata } from '@/types/metadata';

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

export const formatChatHistory = (docs: Document[]): string => {
  return docs
    .map((doc) => {
      const time = doc.metadata.createdAt
        ? formatDate(doc.metadata.createdAt)
        : 'Unknown time';
      const author = doc.metadata.authorName || 'User';
      return `- [${time}] ${author}: ${doc.pageContent}`;
    })
    .join('\n');
};

export const formatSingleContextDocument = (
  doc: Document,
  index: number
): string => {
  const time = doc.metadata?.createdAt
    ? formatDate(doc.metadata.createdAt)
    : 'Unknown time';
  const author = doc.metadata?.author?.name || 'Unknown';
  const sourceId = doc.metadata.id;
  const metadataFormatted = doc.metadata?.formattedMetadata || '';

  const separator = `\n${'='.repeat(80)}\nSOURCE ${index + 1}\n${'='.repeat(80)}`;

  let header = `Source ID: ${sourceId}
Author: ${author}
Time: ${time}`;

  if (metadataFormatted) {
    header += `\nMetadata:\n${metadataFormatted}`;
  } else if (
    doc.metadata?.type === 'node' &&
    doc.metadata.nodeType === 'record' &&
    doc.metadata.parentContext?.name
  ) {
    header += `\nDatabase: ${doc.metadata.parentContext.name}`;
  }
  const content = `\n${'─'.repeat(40)}\nCONTENT:\n${'─'.repeat(40)}\n"${doc.pageContent}"\n`;
  return `${separator}\n${header}${content}`;
};

export const formatContextDocuments = (docs: Document[]): string => {
  return docs.map(formatSingleContextDocument).join('\n');
};

export const selectTopContext = (
  reranked: RerankedContextItem[],
  max: number,
  contextDocuments: Document[]
): Document[] => {
  if (reranked.length === 0) return [];
  const maxScore = Math.max(...reranked.map((item) => item.score));
  const threshold = maxScore * 0.5;

  return reranked
    .filter((item) => item.score >= threshold && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((item) => {
      if (item.index >= 0 && item.index < contextDocuments.length) {
        return contextDocuments[item.index];
      }
      return undefined;
    })
    .filter((doc): doc is Document => doc !== undefined);
};

export const formatMetadataForPrompt = (
  metadata: NodeMetadata | DocumentMetadata
): string => {
  const basicInfo = [
    `Type: ${metadata.type === 'node' ? (metadata as NodeMetadata).nodeType : 'document'}`,
    metadata.name ? `Title: ${metadata.name}` : '',
  ].filter((line) => line.trim() !== '');

  const authorInfo = [
    metadata.author?.name
      ? `Created by: ${metadata.author.name} on ${formatDate(metadata.createdAt)}`
      : '',
    metadata.lastAuthor?.name && metadata.updatedAt
      ? `Last updated by: ${metadata.lastAuthor.name} on ${formatDate(metadata.updatedAt)}`
      : '',
  ].filter((line) => line.trim() !== '');

  const locationInfo = [
    metadata.parentContext?.path ? `Path: ${metadata.parentContext.path}` : '',
    metadata.workspace?.name ? `Workspace: ${metadata.workspace.name}` : '',
  ].filter((line) => line.trim() !== '');

  let formattedMetadata = basicInfo.join('\n');

  if (authorInfo.length > 0) {
    formattedMetadata += '\n' + authorInfo.join('\n');
  }

  if (locationInfo.length > 0) {
    formattedMetadata += '\n' + locationInfo.join('\n');
  }

  if (metadata.databaseInfo) {
    const databaseInfo = [`Database: ${metadata.databaseInfo.name}`];

    if (Object.keys(metadata.databaseInfo.fields).length > 0) {
      databaseInfo.push('Fields:');
      Object.entries(metadata.databaseInfo.fields).forEach(([_, field]) => {
        databaseInfo.push(`  • ${field.name} (${field.type})`);
      });
    }

    formattedMetadata += '\n' + databaseInfo.join('\n');
  }

  return formattedMetadata;
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
): Document => {
  const author = result.createdBy ? authorMap.get(result.createdBy) : null;
  return new Document({
    pageContent: `${result.summary}\n\n${result.text}`,
    metadata: {
      id: result.id,
      score: result.finalScore,
      createdAt: result.createdAt,
      type: result.type === 'semantic' ? 'node' : 'document', // Adjust as needed
      chunkIndex: result.chunkIndex,
      author: author ? { id: author.id, name: author.name || 'Unknown' } : null,
    },
  });
};

export const combineAndScoreSearchResults = (
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  semanticSearchWeight: number,
  keywordSearchWeight: number,
  authorMap: Map<string, { id: string; name: string | null }>
): Promise<Document[]> => {
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
