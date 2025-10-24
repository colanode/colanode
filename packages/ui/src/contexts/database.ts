import { createContext, useContext } from 'react';

import {
  DatabaseNameFieldAttributes,
  FieldAttributes,
  NodeRole,
} from '@colanode/core';

interface DatabaseContext {
  id: string;
  name: string;
  nameField: DatabaseNameFieldAttributes | null | undefined;
  fields: FieldAttributes[];
  canEdit: boolean;
  canCreateRecord: boolean;
  role: NodeRole;
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext
);

export const useDatabase = () => useContext(DatabaseContext);
