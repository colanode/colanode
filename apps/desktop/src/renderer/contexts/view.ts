import {
  SortDirection,
  ViewFilterAttributes,
  ViewSortAttributes,
} from '@colanode/core';
import { ViewField } from '@/shared/types/databases';
import { createContext, useContext } from 'react';

interface ViewContext {
  id: string;
  name: string;
  avatar: string | null;
  fields: ViewField[];
  filters: ViewFilterAttributes[];
  sorts: ViewSortAttributes[];
  groupBy: string | null;
  nameWidth: number;
  isSearchBarOpened: boolean;
  isSortsOpened: boolean;
  setFieldDisplay: (id: string, display: boolean) => void;
  resizeField: (id: string, width: number) => void;
  resizeName: (width: number) => void;
  moveField: (id: string, after: string) => void;
  isFieldFilterOpened: (fieldId: string) => boolean;
  initFieldFilter: (fieldId: string) => void;
  updateFilter: (id: string, filter: ViewFilterAttributes) => void;
  removeFilter: (id: string) => void;
  initFieldSort: (fieldId: string, direction: SortDirection) => void;
  updateSort: (id: string, sort: ViewSortAttributes) => void;
  removeSort: (id: string) => void;
  openSearchBar: () => void;
  closeSearchBar: () => void;
  openSorts: () => void;
  closeSorts: () => void;
  openFieldFilter: (fieldId: string) => void;
  closeFieldFilter: (fieldId: string) => void;
}

export const ViewContext = createContext<ViewContext>({} as ViewContext);

export const useView = () => useContext(ViewContext);
