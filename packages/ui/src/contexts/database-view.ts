import { createContext, useContext } from 'react';

import { ViewField } from '@colanode/client/types';
import {
  SortDirection,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  DatabaseViewLayout,
} from '@colanode/core';

interface DatabaseViewContext {
  id: string;
  name: string;
  avatar: string | null | undefined;
  layout: DatabaseViewLayout;
  fields: ViewField[];
  filters: DatabaseViewFilterAttributes[];
  sorts: DatabaseViewSortAttributes[];
  groupBy: string | null | undefined;
  nameWidth: number;
  isSearchBarOpened: boolean;
  isSortsOpened: boolean;
  isFieldFilterOpened: (fieldId: string) => boolean;
  initFieldFilter: (fieldId: string) => void;
  updateFilter: (id: string, filter: DatabaseViewFilterAttributes) => void;
  removeFilter: (id: string) => void;
  initFieldSort: (fieldId: string, direction: SortDirection) => void;
  updateSort: (id: string, sort: DatabaseViewSortAttributes) => void;
  removeSort: (id: string) => void;
  openSearchBar: () => void;
  closeSearchBar: () => void;
  openSorts: () => void;
  closeSorts: () => void;
  openFieldFilter: (fieldId: string) => void;
  closeFieldFilter: (fieldId: string) => void;
  createRecord: (filters?: DatabaseViewFilterAttributes[]) => void;
}

export const DatabaseViewContext = createContext<DatabaseViewContext>(
  {} as DatabaseViewContext
);

export const useDatabaseView = () => useContext(DatabaseViewContext);
