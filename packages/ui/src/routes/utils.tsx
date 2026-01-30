import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';

export const getDefaultWorkspaceUserId = () => {
  const workspaceUserIds = collections.workspaces.map(
    (workspace) => workspace.userId
  );

  const metadataKey = buildMetadataKey('app', 'workspace');
  const metadataValue = collections.metadata.get(metadataKey)?.value;
  if (metadataValue) {
    const lastUsedWorkspaceId = JSON.parse(metadataValue) as string;
    if (workspaceUserIds.includes(lastUsedWorkspaceId)) {
      return lastUsedWorkspaceId;
    }
  }

  return workspaceUserIds[0];
};

export const getWorkspaceUserId = (workspaceId: string) => {
  for (const [userId, workspace] of collections.workspaces.entries()) {
    if (workspace.workspaceId === workspaceId) {
      return userId;
    }
  }

  return undefined;
};

export const getAccountWorkspaceUserId = (accountId: string) => {
  const allWorkspaces = collections.workspaces.values();
  const workspaceUserIds = Array.from(allWorkspaces)
    .filter((workspace) => workspace.accountId === accountId)
    .map((workspace) => workspace.userId);

  const metadataKey = buildMetadataKey(accountId, 'workspace');
  const metadataValue = collections.metadata.get(metadataKey)?.value;
  if (metadataValue) {
    const lastUsedWorkspaceId = JSON.parse(metadataValue) as string;
    if (workspaceUserIds.includes(lastUsedWorkspaceId)) {
      return lastUsedWorkspaceId;
    }
  }

  return workspaceUserIds[0];
};
