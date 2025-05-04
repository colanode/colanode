import { z } from 'zod';

export const aiProviderSchema = z.enum(['openai', 'google']);
export type AiProvider = z.infer<typeof aiProviderSchema>;

export const aiProviderConfigSchema = z.object({
  apiKey: z.string().default(''),
  enabled: z
    .preprocess((val) => val === 'true', z.boolean().optional())
    .default(false),
});

export type AiProviderConfig = z.infer<typeof aiProviderConfigSchema>;

export const aiModelConfigSchema = z.object({
  provider: aiProviderSchema.default('openai'),
  modelName: z.string().default('gpt-4o'),
  temperature: z.coerce.number().default(0.5),
});

export type AiModelConfig = z.infer<typeof aiModelConfigSchema>;

export const chunkingConfigSchema = z.object({
  defaultChunkSize: z.coerce.number().default(1000),
  defaultOverlap: z.coerce.number().default(200),
  enhanceWithContext: z.preprocess(
    (val) => val === 'true',
    z.boolean().default(false)
  ),
});

export type ChunkingConfig = z.infer<typeof chunkingConfigSchema>;

export const retrievalConfigSchema = z.object({
  hybridSearch: z.object({
    semanticSearchWeight: z.coerce.number().default(0.7),
    keywordSearchWeight: z.coerce.number().default(0.3),
    maxResults: z.coerce.number().default(20),
  }),
});

export type RetrievalConfig = z.infer<typeof retrievalConfigSchema>;

export const aiConfigSchema = z.discriminatedUnion('enabled', [
  z.object({
    enabled: z.literal(true),
    nodeEmbeddingDelay: z.coerce.number().default(5000),
    documentEmbeddingDelay: z.coerce.number().default(10000),
    providers: z.object({
      openai: aiProviderConfigSchema,
      google: aiProviderConfigSchema,
    }),
    langfuse: z.object({
      enabled: z.preprocess(
        (val) => val === 'true',
        z.boolean().default(false)
      ),
      publicKey: z.string().default(''),
      secretKey: z.string().default(''),
      baseUrl: z.string().default('https://cloud.langfuse.com'),
    }),
    models: z.object({
      queryRewrite: aiModelConfigSchema,
      response: aiModelConfigSchema,
      rerank: aiModelConfigSchema,
      summarization: aiModelConfigSchema,
      contextEnhancer: aiModelConfigSchema,
      noContext: aiModelConfigSchema,
      intentRecognition: aiModelConfigSchema,
      databaseFilter: aiModelConfigSchema,
    }),
    embedding: z.object({
      provider: aiProviderSchema.default('openai'),
      modelName: z.string().default('text-embedding-3-large'),
      dimensions: z.coerce.number().default(2000),
      apiKey: z.string().default(''),
      batchSize: z.coerce.number().default(50),
    }),
    chunking: chunkingConfigSchema,
    retrieval: retrievalConfigSchema,
  }),
  z.object({
    enabled: z.literal(false),
  }),
]);

export type AiConfig = z.infer<typeof aiConfigSchema>;

export const readAiConfigVariables = () => {
  return {
    enabled: process.env.AI_ENABLED === 'true',
    nodeEmbeddingDelay: process.env.AI_NODE_EMBEDDING_DELAY,
    documentEmbeddingDelay: process.env.AI_DOCUMENT_EMBEDDING_DELAY,
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        enabled: process.env.OPENAI_ENABLED,
      },
      google: {
        apiKey: process.env.GOOGLE_API_KEY,
        enabled: process.env.GOOGLE_ENABLED,
      },
    },
    langfuse: {
      enabled: process.env.LANGFUSE_ENABLED,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    },
    models: {
      queryRewrite: {
        provider: process.env.QUERY_REWRITE_PROVIDER,
        modelName: process.env.QUERY_REWRITE_MODEL,
        temperature: process.env.QUERY_REWRITE_TEMPERATURE,
      },
      response: {
        provider: process.env.RESPONSE_PROVIDER,
        modelName: process.env.RESPONSE_MODEL,
        temperature: process.env.RESPONSE_TEMPERATURE,
      },
      rerank: {
        provider: process.env.RERANK_PROVIDER,
        modelName: process.env.RERANK_MODEL,
        temperature: process.env.RERANK_TEMPERATURE,
      },
      summarization: {
        provider: process.env.SUMMARIZATION_PROVIDER,
        modelName: process.env.SUMMARIZATION_MODEL,
        temperature: process.env.SUMMARIZATION_TEMPERATURE,
      },
      contextEnhancer: {
        provider: process.env.CHUNK_CONTEXT_PROVIDER,
        modelName: process.env.CHUNK_CONTEXT_MODEL,
        temperature: process.env.CHUNK_CONTEXT_TEMPERATURE,
      },
      noContext: {
        provider: process.env.NO_CONTEXT_PROVIDER,
        modelName: process.env.NO_CONTEXT_MODEL,
        temperature: process.env.NO_CONTEXT_TEMPERATURE,
      },
      intentRecognition: {
        provider: process.env.INTENT_RECOGNITION_PROVIDER,
        modelName: process.env.INTENT_RECOGNITION_MODEL,
        temperature: process.env.INTENT_RECOGNITION_TEMPERATURE,
      },
      databaseFilter: {
        provider: process.env.DATABASE_FILTER_PROVIDER,
        modelName: process.env.DATABASE_FILTER_MODEL,
        temperature: process.env.DATABASE_FILTER_TEMPERATURE,
      },
    },
    embedding: {
      provider: process.env.EMBEDDING_PROVIDER,
      modelName: process.env.EMBEDDING_MODEL,
      dimensions: process.env.EMBEDDING_DIMENSIONS,
      apiKey: process.env.EMBEDDING_API_KEY,
      batchSize: process.env.EMBEDDING_BATCH_SIZE,
    },
    chunking: {
      defaultChunkSize: process.env.CHUNK_DEFAULT_CHUNK_SIZE,
      defaultOverlap: process.env.CHUNK_DEFAULT_OVERLAP,
      enhanceWithContext: process.env.CHUNK_ENHANCE_WITH_CONTEXT,
    },
    retrieval: {
      hybridSearch: {
        semanticSearchWeight:
          process.env.RETRIEVAL_HYBRID_SEARCH_SEMANTIC_WEIGHT,
        keywordSearchWeight: process.env.RETRIEVAL_HYBRID_SEARCH_KEYWORD_WEIGHT,
        maxResults: process.env.RETRIEVAL_HYBRID_SEARCH_MAX_RESULTS,
      },
    },
  };
};
