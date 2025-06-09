import { z } from 'zod/v4';

import {
  richTextContentSchema,
  RichTextContent,
} from '@colanode/core/registry/documents/rich-text';

export const documentContentSchema = z.discriminatedUnion('type', [
  richTextContentSchema,
]);

export type DocumentContent = RichTextContent;
export type DocumentType = DocumentContent['type'];
