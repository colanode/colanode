import { z } from 'zod';
import { ZodText } from './zod';

export const selectOptionAttributesSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  index: z.string(),
});

export type SelectOptionAttributes = z.infer<
  typeof selectOptionAttributesSchema
>;

export const booleanFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('boolean'),
  name: z.string(),
  index: z.string(),
});

export type BooleanFieldAttributes = z.infer<
  typeof booleanFieldAttributesSchema
>;

export const booleanFieldValueSchema = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
});

export type BooleanFieldValue = z.infer<typeof booleanFieldValueSchema>;

export const collaboratorFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('collaborator'),
  name: z.string(),
  index: z.string(),
});

export type CollaboratorFieldAttributes = z.infer<
  typeof collaboratorFieldAttributesSchema
>;

export const collaboratorFieldValueSchema = z.object({
  type: z.literal('collaborator'),
  value: z.array(z.string()),
});

export type CollaboratorFieldValue = z.infer<
  typeof collaboratorFieldValueSchema
>;

export const createdAtFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('createdAt'),
  name: z.string(),
  index: z.string(),
});

export type CreatedAtFieldAttributes = z.infer<
  typeof createdAtFieldAttributesSchema
>;

export const createdAtFieldValueSchema = z.object({
  type: z.literal('createdAt'),
  value: z.string(),
});

export type CreatedAtFieldValue = z.infer<typeof createdAtFieldValueSchema>;

export const createdByFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('createdBy'),
  name: z.string(),
  index: z.string(),
});

export type CreatedByFieldAttributes = z.infer<
  typeof createdByFieldAttributesSchema
>;

export const createdByFieldValueSchema = z.object({
  type: z.literal('createdBy'),
  value: z.string(),
});

export type CreatedByFieldValue = z.infer<typeof createdByFieldValueSchema>;

export const dateFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('date'),
  name: z.string(),
  index: z.string(),
});

export type DateFieldAttributes = z.infer<typeof dateFieldAttributesSchema>;

export const dateFieldValueSchema = z.object({
  type: z.literal('date'),
  value: z.string(),
});

export type DateFieldValue = z.infer<typeof dateFieldValueSchema>;

export const emailFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('email'),
  name: z.string(),
  index: z.string(),
});

export type EmailFieldAttributes = z.infer<typeof emailFieldAttributesSchema>;

export const emailFieldValueSchema = z.object({
  type: z.literal('email'),
  value: z.string(),
});

export type EmailFieldValue = z.infer<typeof emailFieldValueSchema>;

export const fileFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  name: z.string(),
  index: z.string(),
});

export type FileFieldAttributes = z.infer<typeof fileFieldAttributesSchema>;

export const fileFieldValueSchema = z.object({
  type: z.literal('file'),
  value: z.array(z.string()),
});

export type FileFieldValue = z.infer<typeof fileFieldValueSchema>;

export const multiSelectFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('multiSelect'),
  name: z.string(),
  index: z.string(),
  options: z.record(z.string(), selectOptionAttributesSchema).optional(),
});

export type MultiSelectFieldAttributes = z.infer<
  typeof multiSelectFieldAttributesSchema
>;

export const multiSelectFieldValueSchema = z.object({
  type: z.literal('multiSelect'),
  value: z.array(z.string()),
});

export type MultiSelectFieldValue = z.infer<typeof multiSelectFieldValueSchema>;

export const numberFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('number'),
  name: z.string(),
  index: z.string(),
});

export type NumberFieldAttributes = z.infer<typeof numberFieldAttributesSchema>;

export const numberFieldValueSchema = z.object({
  type: z.literal('number'),
  value: z.number(),
});

export type NumberFieldValue = z.infer<typeof numberFieldValueSchema>;

export const phoneFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('phone'),
  name: z.string(),
  index: z.string(),
});

export type PhoneFieldAttributes = z.infer<typeof phoneFieldAttributesSchema>;

export const phoneFieldValueSchema = z.object({
  type: z.literal('phone'),
  value: z.string(),
});

export type PhoneFieldValue = z.infer<typeof phoneFieldValueSchema>;

export const relationFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('relation'),
  name: z.string(),
  index: z.string(),
});

export type RelationFieldAttributes = z.infer<
  typeof relationFieldAttributesSchema
>;

export const relationFieldValueSchema = z.object({
  type: z.literal('relation'),
  value: z.array(z.string()),
});

export type RelationFieldValue = z.infer<typeof relationFieldValueSchema>;

export const rollupFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('rollup'),
  name: z.string(),
  index: z.string(),
});

export type RollupFieldAttributes = z.infer<typeof rollupFieldAttributesSchema>;

export const rollupFieldValueSchema = z.object({
  type: z.literal('rollup'),
  value: z.string(),
});

export type RollupFieldValue = z.infer<typeof rollupFieldValueSchema>;

export const selectFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('select'),
  name: z.string(),
  index: z.string(),
  options: z.record(z.string(), selectOptionAttributesSchema).optional(),
});

export type SelectFieldAttributes = z.infer<typeof selectFieldAttributesSchema>;

export const selectFieldValueSchema = z.object({
  type: z.literal('select'),
  value: z.string(),
});

export type SelectFieldValue = z.infer<typeof selectFieldValueSchema>;

export const textFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  name: z.string(),
  index: z.string(),
});

export type TextFieldAttributes = z.infer<typeof textFieldAttributesSchema>;

export const textFieldValueSchema = z.object({
  type: z.literal('text'),
  value: ZodText.create(),
});

export type TextFieldValue = z.infer<typeof textFieldValueSchema>;

export const urlFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('url'),
  name: z.string(),
  index: z.string(),
});

export type UrlFieldAttributes = z.infer<typeof urlFieldAttributesSchema>;

export const urlFieldValueSchema = z.object({
  type: z.literal('url'),
  value: z.string(),
});

export const updatedAtFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('updatedAt'),
  name: z.string(),
  index: z.string(),
});

export type UpdatedAtFieldAttributes = z.infer<
  typeof updatedAtFieldAttributesSchema
>;

export const updatedAtFieldValueSchema = z.object({
  type: z.literal('updatedAt'),
  value: z.string(),
});

export type UpdatedAtFieldValue = z.infer<typeof updatedAtFieldValueSchema>;

export const updatedByFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('updatedBy'),
  name: z.string(),
  index: z.string(),
});

export type UpdatedByFieldAttributes = z.infer<
  typeof updatedByFieldAttributesSchema
>;

export const updatedByFieldValueSchema = z.object({
  type: z.literal('updatedBy'),
  value: z.string(),
});

export const fieldAttributesSchema = z.discriminatedUnion('type', [
  booleanFieldAttributesSchema,
  collaboratorFieldAttributesSchema,
  createdAtFieldAttributesSchema,
  createdByFieldAttributesSchema,
  dateFieldAttributesSchema,
  emailFieldAttributesSchema,
  fileFieldAttributesSchema,
  multiSelectFieldAttributesSchema,
  numberFieldAttributesSchema,
  phoneFieldAttributesSchema,
  relationFieldAttributesSchema,
  rollupFieldAttributesSchema,
  selectFieldAttributesSchema,
  textFieldAttributesSchema,
  urlFieldAttributesSchema,
  updatedAtFieldAttributesSchema,
  updatedByFieldAttributesSchema,
]);

export type FieldAttributes = z.infer<typeof fieldAttributesSchema>;

export const fieldValueSchema = z.discriminatedUnion('type', [
  booleanFieldValueSchema,
  collaboratorFieldValueSchema,
  createdAtFieldValueSchema,
  createdByFieldValueSchema,
  dateFieldValueSchema,
  emailFieldValueSchema,
  fileFieldValueSchema,
  multiSelectFieldValueSchema,
  numberFieldValueSchema,
  phoneFieldValueSchema,
  relationFieldValueSchema,
  rollupFieldValueSchema,
  selectFieldValueSchema,
  textFieldValueSchema,
  urlFieldValueSchema,
  updatedAtFieldValueSchema,
  updatedByFieldValueSchema,
]);

export type FieldValue = z.infer<typeof fieldValueSchema>;

export type FieldType = Extract<FieldAttributes['type'], string>;
