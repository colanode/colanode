import { z } from 'zod/v4';

import { ZOD_TEXT_DESCRIPTION } from '@colanode/core/lib/constants';

export const blockLeafSchema = z.object({
  type: z.string(),
  text: z.string().nullable().optional().describe(ZOD_TEXT_DESCRIPTION),
  attrs: z.record(z.string(), z.any()).nullable().optional(),
  marks: z
    .array(
      z.object({
        type: z.string(),
        attrs: z.record(z.string(), z.any()).nullable().optional(),
      })
    )
    .nullable()
    .optional(),
});

export type BlockLeaf = z.infer<typeof blockLeafSchema>;

export const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  parentId: z.string(),
  content: z.array(blockLeafSchema).nullable().optional(),
  attrs: z.record(z.string(), z.any()).nullable().optional(),
  index: z.string(),
});

export type Block = z.infer<typeof blockSchema>;
