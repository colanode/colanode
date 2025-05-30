import { z } from 'zod';

import { blockSchema } from '@colanode/core/registry/block';

export const richTextContentSchema = z.object({
  type: z.literal('rich_text'),
  blocks: z.record(blockSchema),
});

export type RichTextContent = z.infer<typeof richTextContentSchema>;
