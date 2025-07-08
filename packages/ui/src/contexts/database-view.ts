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
  rename: (name: string) => void;
  updateAvatar: (avatar: string) => void;
  setFieldDisplay: (id: string, display: boolean) => void;
  resizeField: (id: string, width: number) => void;
  resizeName: (width: number) => void;
  setGroupBy: (fieldId: string | null) => void;
  moveField: (id: string, after: string) => void;
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
