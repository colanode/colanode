import { z } from 'zod/v4';

import { ZodText } from '@colanode/core';

export const booleanFieldValueSchema = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
});

export type BooleanFieldValue = z.infer<typeof booleanFieldValueSchema>;

export const stringFieldValueSchema = z.object({
  type: z.literal('string'),
  value: z.string(),
});

export type StringFieldValue = z.infer<typeof stringFieldValueSchema>;

export const stringArrayFieldValueSchema = z.object({
  type: z.literal('string_array'),
  value: z.array(z.string()),
});

export type StringArrayFieldValue = z.infer<typeof stringArrayFieldValueSchema>;

export const numberFieldValueSchema = z.object({
  type: z.literal('number'),
  value: z.number(),
});

export type NumberFieldValue = z.infer<typeof numberFieldValueSchema>;

export const textFieldValueSchema = z.object({
  type: z.literal('text'),
  value: new ZodText(),
});

export type TextFieldValue = z.infer<typeof textFieldValueSchema>;

export const fieldValueSchema = z.discriminatedUnion('type', [
  booleanFieldValueSchema,
  stringFieldValueSchema,
  stringArrayFieldValueSchema,
  numberFieldValueSchema,
  textFieldValueSchema,
]);

export type FieldValue = z.infer<typeof fieldValueSchema>;
export type FieldValueType = FieldValue['type'];
