import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

import { config } from '@colanode/server/lib/config';

export type AIProvider = 'openai' | 'google';

export type AITask =
  | 'response' // Main assistant responses
  | 'intentRecognition' // Intent classification
  | 'rerank' // Document reranking
  | 'databaseFilter'; // Database filtering

export const getModelForTask = (task: AITask) => {
  if (!config.ai.enabled) {
    throw new Error('AI is disabled in configuration.');
  }

  if (!('models' in config.ai) || !('providers' in config.ai)) {
    throw new Error('AI configuration is incomplete.');
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

function createModelInstance(
  provider: AIProvider,
  modelName: string,
  apiKey: string
) {
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

export const isAIEnabled = (): boolean => {
  return config.ai.enabled;
};

export const getAvailableProviders = (): AIProvider[] => {
  if (!config.ai.enabled || !('providers' in config.ai)) {
    return [];
  }

  const aiConfig = config.ai as {
    providers: Record<AIProvider, { enabled: boolean }>;
  };
  return Object.keys(aiConfig.providers).filter(
    (provider) => aiConfig.providers[provider as AIProvider].enabled
  ) as AIProvider[];
};

export const ModelConfig = {
  forAssistant: () => getModelForTask('response'),
  forIntentRecognition: () => getModelForTask('intentRecognition'),
  forReranking: () => getModelForTask('rerank'),
  forDatabaseFilter: () => getModelForTask('databaseFilter'),
} as const;
