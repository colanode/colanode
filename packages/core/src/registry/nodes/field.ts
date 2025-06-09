import { z } from 'zod/v4';

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

export const collaboratorFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('collaborator'),
  name: z.string(),
  index: z.string(),
});

export type CollaboratorFieldAttributes = z.infer<
  typeof collaboratorFieldAttributesSchema
>;

export const createdAtFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('created_at'),
  name: z.string(),
  index: z.string(),
});

export type CreatedAtFieldAttributes = z.infer<
  typeof createdAtFieldAttributesSchema
>;

export const createdByFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('created_by'),
  name: z.string(),
  index: z.string(),
});

export type CreatedByFieldAttributes = z.infer<
  typeof createdByFieldAttributesSchema
>;

export const dateFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('date'),
  name: z.string(),
  index: z.string(),
});

export type DateFieldAttributes = z.infer<typeof dateFieldAttributesSchema>;

export const emailFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('email'),
  name: z.string(),
  index: z.string(),
});

export type EmailFieldAttributes = z.infer<typeof emailFieldAttributesSchema>;

export const fileFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  name: z.string(),
  index: z.string(),
});

export type FileFieldAttributes = z.infer<typeof fileFieldAttributesSchema>;

export const multiSelectFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('multi_select'),
  name: z.string(),
  index: z.string(),
  options: z.record(z.string(), selectOptionAttributesSchema).optional(),
});

export type MultiSelectFieldAttributes = z.infer<
  typeof multiSelectFieldAttributesSchema
>;

export const numberFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('number'),
  name: z.string(),
  index: z.string(),
});

export type NumberFieldAttributes = z.infer<typeof numberFieldAttributesSchema>;

export const phoneFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('phone'),
  name: z.string(),
  index: z.string(),
});

export type PhoneFieldAttributes = z.infer<typeof phoneFieldAttributesSchema>;

export const relationFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('relation'),
  name: z.string(),
  index: z.string(),
  databaseId: z.string().optional().nullable(),
});

export type RelationFieldAttributes = z.infer<
  typeof relationFieldAttributesSchema
>;

export const rollupFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('rollup'),
  name: z.string(),
  index: z.string(),
});

export type RollupFieldAttributes = z.infer<typeof rollupFieldAttributesSchema>;

export const selectFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('select'),
  name: z.string(),
  index: z.string(),
  options: z.record(z.string(), selectOptionAttributesSchema).optional(),
});

export type SelectFieldAttributes = z.infer<typeof selectFieldAttributesSchema>;

export const textFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  name: z.string(),
  index: z.string(),
});

export type TextFieldAttributes = z.infer<typeof textFieldAttributesSchema>;

export const urlFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('url'),
  name: z.string(),
  index: z.string(),
});

export type UrlFieldAttributes = z.infer<typeof urlFieldAttributesSchema>;

export const updatedAtFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('updated_at'),
  name: z.string(),
  index: z.string(),
});

export type UpdatedAtFieldAttributes = z.infer<
  typeof updatedAtFieldAttributesSchema
>;

export const updatedByFieldAttributesSchema = z.object({
  id: z.string(),
  type: z.literal('updated_by'),
  name: z.string(),
  index: z.string(),
});

export type UpdatedByFieldAttributes = z.infer<
  typeof updatedByFieldAttributesSchema
>;

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

export type FieldType = Extract<FieldAttributes['type'], string>;
