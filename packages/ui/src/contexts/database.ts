import { createContext, useContext } from 'react';

import {
  DatabaseNameFieldAttributes,
  DatabasePurpose,
  FieldAttributes,
  NodeRole,
} from '@colanode/core';

interface DatabaseContext {
  id: string;
  name: string;
  nameField: DatabaseNameFieldAttributes | null | undefined;
  fields: FieldAttributes[];
  purpose: DatabasePurpose;
  canEdit: boolean;
  isLocked: boolean;
  canCreateRecord: boolean;
  canCreatePage: boolean;
  role: NodeRole;
  rootId: string;
  toggleLock: () => void;
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext
);

export const useDatabase = () => useContext(DatabaseContext);
