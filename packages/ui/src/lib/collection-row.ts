import { LocalPageNode, LocalRecordNode } from '@colanode/client/types';
import { FieldValue } from '@colanode/core';

type CollectionRowBase = {
  id: string;
  name: string;
  fields: Record<string, FieldValue>;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type CollectionRow =
  | (CollectionRowBase & { nodeType: 'record'; source: LocalRecordNode })
  | (CollectionRowBase & { nodeType: 'page'; source: LocalPageNode });

export const recordToCollectionRow = (
  record: LocalRecordNode
): CollectionRow => ({
  id: record.id,
  name: record.name,
  fields: record.fields,
  nodeType: 'record',
  createdAt: record.createdAt,
  createdBy: record.createdBy,
  updatedAt: record.updatedAt,
  updatedBy: record.updatedBy,
  source: record,
});

export const pageToCollectionRow = (page: LocalPageNode): CollectionRow => ({
  id: page.id,
  name: page.name,
  fields: page.fields ?? {},
  nodeType: 'page',
  createdAt: page.createdAt,
  createdBy: page.createdBy,
  updatedAt: page.updatedAt,
  updatedBy: page.updatedBy,
  source: page,
});
