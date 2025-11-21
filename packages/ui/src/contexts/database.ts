import { createContext, useContext } from 'react';

import {
  DatabaseNameFieldAttributes,
  FieldAttributes,
  NodeRole,
  SelectOptionAttributes,
} from '@colanode/core';

interface DatabaseContext {
  id: string;
  name: string;
  nameField: DatabaseNameFieldAttributes | null | undefined;
  fields: FieldAttributes[];
  canEdit: boolean;
  canCreateRecord: boolean;
  role: NodeRole;
  rootId: string;
  createSelectOption: (fieldId: string, name: string, color: string) => void;
  updateSelectOption: (
    fieldId: string,
    attributes: SelectOptionAttributes
  ) => void;
  deleteSelectOption: (fieldId: string, optionId: string) => void;
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext
);

export const useDatabase = () => useContext(DatabaseContext);
