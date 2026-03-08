import { createContext, useContext } from 'react';

import { WorkspaceRole } from '@colanode/core';
import { Workspace } from '@colanode/client/types/workspaces';

interface WorkspaceContextValue {
  userId: string;
  accountId: string;
  workspaceId: string;
  role: WorkspaceRole;
  workspace: Workspace;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null
);

export const useWorkspace = (): WorkspaceContextValue => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
};
