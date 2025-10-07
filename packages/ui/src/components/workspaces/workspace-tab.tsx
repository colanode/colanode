import { eq, useLiveQuery } from '@tanstack/react-db';

import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { database } from '@colanode/ui/data';

interface WorkspaceTabProps {
  accountId: string;
  workspaceId: string;
}

export const WorkspaceTab = ({ accountId, workspaceId }: WorkspaceTabProps) => {
  const workspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: database.accountWorkspaces(accountId) })
      .where(({ workspaces }) => eq(workspaces.id, workspaceId))
      .select(({ workspaces }) => ({
        id: workspaces.id,
        name: workspaces.name,
        avatar: workspaces.avatar,
      }))
  );

  const workspace = workspaceQuery.data?.[0];
  if (!workspace) {
    return null;
  }

  return (
    <Tab id={workspace.id} avatar={workspace.avatar} name={workspace.name} />
  );
};
