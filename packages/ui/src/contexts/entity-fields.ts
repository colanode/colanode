import { createContext, useContext } from 'react';

import { FieldValue } from '@colanode/core';

export type EntityFieldType = 'record' | 'page';

export interface EntityFieldsContextValue {
  entityType: EntityFieldType;
  id: string;
  name: string;
  avatar?: string | null;
  fields: Record<string, FieldValue>;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  schemaId: string;
  localRevision: string;
  canEdit: boolean;
}

export const EntityFieldsContext = createContext<EntityFieldsContextValue | null>(
  null
);

export const useEntityFields = () => {
  const context = useContext(EntityFieldsContext);
  if (!context) {
    throw new Error('useEntityFields must be used within EntityFieldsProvider');
  }

  return context;
};
