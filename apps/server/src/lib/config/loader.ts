import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { Configuration } from './index';

type ConfigSource = Partial<Configuration>;

const ENV_POINTER_PATTERN = /^env:\/\/([A-Z0-9_]+)(\?)?$/;

export class MissingEnvVarError extends Error {
  constructor(varName: string) {
    super(`Missing required environment variable: ${varName}`);
    this.name = 'MissingEnvVarError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const deepMerge = (
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = result[key];

    if (isRecord(baseValue) && isRecord(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }

    result[key] = overrideValue;
  }

  return result;
};

const normalizeValue = (value: unknown): unknown => {
  if (value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const match = value.match(ENV_POINTER_PATTERN);

    if (!match) {
      return value;
    }

    const [, envName, optionalFlag] = match;
    const envValue = process.env[envName!];
    const optional = optionalFlag === '?';

    if (envValue === undefined) {
      if (optional) {
        return undefined;
      }

      throw new MissingEnvVarError(envName!);
    }

    return envValue;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (isRecord(value)) {
    const normalized: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(value)) {
      // Skip fields starting with underscore (documentation fields)
      if (key.startsWith('_')) {
        continue;
      }

      const processed = normalizeValue(nested);

      if (processed !== undefined) {
        normalized[key] = processed;
      }
    }

    return normalized;
  }

  return value;
};

const candidateConfigDirectories = (): string[] => {
  const cwd = process.cwd();
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.resolve(moduleDir, '../../..');
  const candidates = [serverRoot, cwd, path.join(cwd, 'apps/server')];

  return Array.from(new Set(candidates.map((dir) => path.resolve(dir))));
};

const findConfigFile = (filename: string): string | undefined => {
  for (const dir of candidateConfigDirectories()) {
    const candidate = path.join(dir, filename);

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const readJsonFile = (
  filePath: string | undefined
): Record<string, unknown> => {
  if (!filePath) {
    return {};
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!isRecord(parsed)) {
      throw new Error('configuration file must contain a JSON object');
    }

    return parsed;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read ${filePath}: ${reason}`);
  }
};

export const resolveEnvPointers = (value: unknown): unknown => {
  return normalizeValue(value);
};

export const loadRawConfig = (
  envOverrides: Record<string, unknown>
): ConfigSource => {
  const jsonConfig = readJsonFile(
    findConfigFile('config.json')
  ) as ConfigSource;

  const merged = deepMerge(jsonConfig as Record<string, unknown>, envOverrides);

  return normalizeValue(merged) as ConfigSource;
};
