import { z } from 'zod';

import { ZodText } from './zod';

export const blockLeafSchema = z.object({
  type: z.string(),
  text: ZodText.create(),
  marks: z
    .array(
      z.object({
        type: z.string(),
        attrs: z.record(z.any()).nullable(),
      })
    )
    .nullable(),
});

export type BlockLeaf = z.infer<typeof blockLeafSchema>;

export const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  parentId: z.string(),
  content: z.array(blockLeafSchema).nullable(),
  attrs: z.record(z.any()).nullable(),
  index: z.string(),
});

export type Block = z.infer<typeof blockSchema>;
