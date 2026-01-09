import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';

import { Configuration } from './index';

type ConfigSource = Partial<Configuration>;

const ENV_POINTER_PATTERN = /^env:\/\/([A-Z0-9_]+)(\?)?$/;
const FILE_POINTER_PATTERN = /^file:\/\/(.+?)(\?)?$/;

export class MissingEnvVarError extends Error {
  constructor(varName: string) {
    super(`Missing required environment variable: ${varName}`);
    this.name = 'MissingEnvVarError';
  }
}

export class MissingFileError extends Error {
  constructor(filePath: string) {
    super(`Missing required configuration file: ${filePath}`);
    this.name = 'MissingFileError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

type NormalizeContext = {
  configDir: string;
};

const normalizeValue = (value: unknown, ctx: NormalizeContext): unknown => {
  if (value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return resolvePointerValue(value, ctx);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, ctx));
  }

  if (isRecord(value)) {
    const normalized: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(value)) {
      // Skip fields starting with underscore (documentation fields)
      if (key.startsWith('_')) {
        continue;
      }

      const processed = normalizeValue(nested, ctx);

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
  const candidates = [cwd, path.join(cwd, 'apps/server'), serverRoot];

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

const readJsonFile = (filePath: string): Record<string, unknown> => {
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

const resolvePointerValue = (value: string, ctx: NormalizeContext): unknown => {
  const envMatch = value.match(ENV_POINTER_PATTERN);

  if (envMatch) {
    const [, envName, optionalFlag] = envMatch;
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

  const fileMatch = value.match(FILE_POINTER_PATTERN);

  if (fileMatch) {
    const [, rawPath, optionalFlag] = fileMatch;
    const optional = optionalFlag === '?';
    const resolvedPath = path.isAbsolute(rawPath!)
      ? rawPath!
      : path.resolve(ctx.configDir, rawPath!);

    if (!fs.existsSync(resolvedPath)) {
      if (optional) {
        return undefined;
      }

      throw new MissingFileError(resolvedPath);
    }

    try {
      return fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read ${resolvedPath}: ${reason}`);
    }
  }

  return value;
};

export const resolveEnvPointers = (
  value: unknown,
  ctx: NormalizeContext
): unknown => {
  return normalizeValue(value, ctx);
};

export const loadRawConfig = (): ConfigSource => {
  const configPath = findConfigFile('config.json');

  if (!configPath) {
    throw new Error(
      [
        'Unable to find config.json.',
        'Copy apps/server/config.json (or mount your own) so the server has a configuration file.',
      ].join(' ')
    );
  }

  const jsonConfig = readJsonFile(configPath) as ConfigSource;

  return normalizeValue(jsonConfig, {
    configDir: path.dirname(configPath),
  }) as ConfigSource;
};
