import { collections } from '@colanode/ui/collections';

export const getDefaultWorkspaceUserId = () => {
  const workspaceIds = collections.workspaces.map(
    (workspace) => workspace.userId
  );

  const lastUsedWorkspaceId = collections.metadata.get('workspace')?.value as
    | string
    | undefined;

  return lastUsedWorkspaceId ?? workspaceIds[0];
};

export const getWorkspaceUserId = (workspaceId: string) => {
  for (const [userId, workspace] of collections.workspaces.entries()) {
    if (workspace.workspaceId === workspaceId) {
      return userId;
    }
  }

  return undefined;
};
