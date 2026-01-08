import { createContext, useContext } from 'react';

import { LocalDatabaseViewNode } from '@colanode/client/types';

interface DatabaseViewsContext {
  views: LocalDatabaseViewNode[];
  viewId: string;
  onViewChange: (viewId: string) => void;
  inline: boolean;
}

export const DatabaseViewsContext = createContext<DatabaseViewsContext>(
  {} as DatabaseViewsContext
);

export const useDatabaseViews = () => useContext(DatabaseViewsContext);
