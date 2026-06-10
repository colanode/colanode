import { LocalDatabaseNode } from '@colanode/client/types';
import { DEFAULT_PAGE_META_TYPE_NAME } from '@colanode/core';

export const fetchDefaultPageMetaTypeId = async (
  userId: string
): Promise<string> => {
  const nodes = await window.colanode.executeQuery({
    type: 'node.list',
    userId,
    filters: [
      {
        field: ['type'],
        operator: 'eq',
        value: 'database',
      },
    ],
    sorts: [],
  });

  const metaTypes = nodes.filter(
    (node): node is LocalDatabaseNode =>
      node.type === 'database' &&
      (node.purpose ?? 'records') === 'meta_type'
  );

  const defaultMetaType =
    metaTypes.find((metaType) => metaType.name === DEFAULT_PAGE_META_TYPE_NAME) ??
    metaTypes[0];

  if (!defaultMetaType) {
    throw new Error('No page meta type is available.');
  }

  return defaultMetaType.id;
};
