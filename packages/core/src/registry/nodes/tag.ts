import { z } from 'zod/v4';

export const tagAttributesSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    index: z.string(),
});

export type TagAttributes = z.infer<typeof tagAttributesSchema>;
