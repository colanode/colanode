/**
 * AI Model Configuration
 *
 * This file handles model provider configuration and initialization
 * for different AI tasks (response generation, intent recognition, etc.)
 */

import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

import { config } from '@colanode/server/lib/config';

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'google';

/**
 * Available AI tasks that require different models
 */
export type AITask =
  | 'response' // Main assistant responses
  | 'queryRewrite' // Query optimization
  | 'intentRecognition' // Intent classification
  | 'noContext' // General knowledge responses
  | 'contextEnhancer' // Context enhancement
  | 'rerank' // Document reranking
  | 'summarization' // Text summarization
  | 'databaseFilter'; // Database filtering

/**
 * Get the appropriate AI model for a specific task
 *
 * @param task - The AI task requiring a model
 * @returns Configured AI model instance
 * @throws Error if AI is disabled or provider is not supported
 */
export const getModelForTask = (task: AITask) => {
  if (!config.ai.enabled) {
    throw new Error('AI is disabled in configuration.');
  }

  const modelConfig = config.ai.models[task as keyof typeof config.ai.models];

  if (!modelConfig) {
    throw new Error(`No model configuration found for task: ${task}`);
  }

  const providerConfig = config.ai.providers[modelConfig.provider];

  if (!providerConfig.enabled) {
    throw new Error(`AI provider '${modelConfig.provider}' is disabled.`);
  }

  return createModelInstance(
    modelConfig.provider,
    modelConfig.modelName,
    providerConfig.apiKey
  );
};

/**
 * Create a model instance for the specified provider
 *
 * @param provider - The AI provider (openai, google)
 * @param modelName - The specific model name
 * @param apiKey - The API key for the provider
 * @returns Configured model instance
 */
function createModelInstance(
  provider: AIProvider,
  modelName: string,
  apiKey: string
) {
  // Set API keys as environment variables for the AI SDK
  switch (provider) {
    case 'openai':
      process.env.OPENAI_API_KEY = apiKey;
      return openai(modelName);

    case 'google':
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      return google(modelName);

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Check if AI functionality is enabled
 */
export const isAIEnabled = (): boolean => {
  return config.ai.enabled;
};

/**
 * Get available AI providers
 */
export const getAvailableProviders = (): AIProvider[] => {
  return Object.keys(config.ai.providers).filter(
    (provider) => config.ai.providers[provider as AIProvider].enabled
  ) as AIProvider[];
};

/**
 * Model configuration utilities for different use cases
 */
export const ModelConfig = {
  /**
   * Get model for main assistant responses
   */
  forAssistant: () => getModelForTask('response'),

  /**
   * Get model for query optimization
   */
  forQueryRewrite: () => getModelForTask('queryRewrite'),

  /**
   * Get model for intent recognition
   */
  forIntentRecognition: () => getModelForTask('intentRecognition'),

  /**
   * Get model for general knowledge responses
   */
  forGeneralKnowledge: () => getModelForTask('noContext'),

  /**
   * Get model for document reranking
   */
  forReranking: () => getModelForTask('rerank'),

  /**
   * Get model for text summarization
   */
  forSummarization: () => getModelForTask('summarization'),

  /**
   * Get model for database filtering
   */
  forDatabaseFilter: () => getModelForTask('databaseFilter'),
} as const;
