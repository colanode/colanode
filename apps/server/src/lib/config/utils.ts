import fs from 'node:fs';

import { z } from 'zod/v4';

const resolveValue = (
  val: string,
  ctx: z.core.$RefinementCtx<string>
): string => {
  if (val.startsWith('env://')) {
    const envName = val.slice(6);
    const envValue = process.env[envName];
    if (envValue === undefined) {
      ctx.addIssue({
        code: 'invalid_value',
        message: `Environment variable "${envName}" is not set`,
        values: [envName],
      });
      return z.NEVER;
    }

    return envValue;
  }

  if (val.startsWith('file://')) {
    const filePath = val.slice(7);
    try {
      return fs.readFileSync(filePath, 'utf-8').trim();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      ctx.addIssue({
        code: 'invalid_value',
        message: `Failed to read secret from file "${filePath}": ${error.message}`,
        values: [filePath],
      });
      return z.NEVER;
    }
  }

  return val;
};

export const resolveConfigReference = (
  val: string,
  ctx: z.core.$RefinementCtx<string>
): string => {
  return resolveValue(val, ctx);
};

export const resolveOptionalConfigReference = (
  val: string | undefined,
  ctx: z.core.$RefinementCtx<string | undefined>
): string | undefined => {
  if (val === undefined) {
    return undefined;
  }

  return resolveValue(val, ctx as z.core.$RefinementCtx<string>);
};
