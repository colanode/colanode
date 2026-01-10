import { z } from 'zod/v4';

import { resolveConfigReference } from './utils';

const corsOriginSchema = z.union([
  z.string().transform(resolveConfigReference),
  z.array(z.string().transform(resolveConfigReference)),
  z.boolean(),
]);

export const corsSchema = z
  .object({
    origin: corsOriginSchema.default('http://localhost:4000'),
    maxAge: z.coerce.number().default(7200),
  })
  .prefault({});

export type CorsConfig = z.infer<typeof corsSchema>;
