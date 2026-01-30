import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';

export const getDefaultWorkspaceUserId = () => {
  const workspaceIds = collections.workspaces.map(
    (workspace) => workspace.userId
  );

  const metadataKey = buildMetadataKey('app', 'workspace');
  const metadataValue = collections.metadata.get(metadataKey)?.value;
  if (metadataValue) {
    const lastUsedWorkspaceId = JSON.parse(metadataValue) as string;
    if (workspaceIds.includes(lastUsedWorkspaceId)) {
      return lastUsedWorkspaceId;
    }
  }

  return workspaceIds[0];
};

export const getWorkspaceUserId = (workspaceId: string) => {
  for (const [userId, workspace] of collections.workspaces.entries()) {
    if (workspace.workspaceId === workspaceId) {
      return userId;
    }
  }

  return undefined;
};
