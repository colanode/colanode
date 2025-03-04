export type SearchResult = {
  id: string;
  text: string;
  summary: string | null;
  score: number;
  type: 'semantic' | 'keyword';
  createdAt?: Date;
  createdBy?: string;
  chunkIndex: number;
};
