import { createContext, useContext } from 'react';

import {
  DatabaseViewFilterAttributes,
  FieldAttributes,
  FieldValue,
} from '@colanode/core';

interface RecordItem {
  id: string;
  name: string;
  fields: Record<string, FieldValue>;
  canEdit: boolean;
}

interface BoardViewContext {
  field: FieldAttributes;
  filter: DatabaseViewFilterAttributes;
  canDrop: (record: RecordItem) => boolean;
  drop: (record: RecordItem) => FieldValue | null;
  dragOverClass?: string;
  header: React.ReactNode;
  canDrag: (record: RecordItem) => boolean;
  onDragEnd: (item: RecordItem, value: FieldValue | null) => void;
}

export const BoardViewContext = createContext<BoardViewContext>(
  {} as BoardViewContext
);

export const useBoardView = () => useContext(BoardViewContext);
