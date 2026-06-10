import { createContext, useContext } from 'react';

import { FieldValue } from '@colanode/core';
import { EntityFieldsContext } from '@colanode/ui/contexts/entity-fields';

interface RecordContext {
  id: string;
  name: string;
  avatar?: string | null;
  fields: Record<string, FieldValue>;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  databaseId: string;
  canEdit: boolean;
  localRevision: string;
}

export const RecordContext = createContext<RecordContext>({} as RecordContext);

export const useRecord = (): RecordContext => {
  const entity = useContext(EntityFieldsContext);

  if (entity) {
    return {
      id: entity.id,
      name: entity.name,
      avatar: entity.avatar,
      fields: entity.fields,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedBy: entity.updatedBy,
      updatedAt: entity.updatedAt,
      databaseId: entity.schemaId,
      localRevision: entity.localRevision,
      canEdit: entity.canEdit,
    };
  }

  return useContext(RecordContext);
};
