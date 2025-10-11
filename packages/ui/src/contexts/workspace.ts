import { createContext, useContext } from 'react';

import { WorkspaceRole } from '@colanode/core';

interface WorkspaceContext {
  workspaceId: string;
  accountId: string;
  userId: string;
  role: WorkspaceRole;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext
);

export const useWorkspace = () => useContext(WorkspaceContext);
