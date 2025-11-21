import { createContext, useContext } from 'react';

import { WorkspaceRole } from '@colanode/core';
import { WorkspaceCollections } from '@colanode/ui/collections';

interface WorkspaceContext {
  workspaceId: string;
  accountId: string;
  userId: string;
  role: WorkspaceRole;
  collections: WorkspaceCollections;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext
);

export const useWorkspace = () => useContext(WorkspaceContext);
