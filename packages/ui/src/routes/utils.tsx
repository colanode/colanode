import { database } from '@colanode/ui/data';

export const getDefaultWorkspaceUserId = () => {
  const workspaceIds = database.workspaces.map((workspace) => workspace.userId);

  const lastUsedWorkspaceId = database.metadata.get('workspace')?.value as
    | string
    | undefined;

  return lastUsedWorkspaceId ?? workspaceIds[0];
};

export const getWorkspaceUserId = (workspaceId: string) => {
  for (const [userId, workspace] of database.workspaces.entries()) {
    if (workspace.workspaceId === workspaceId) {
      return userId;
    }
  }

  return undefined;
};
