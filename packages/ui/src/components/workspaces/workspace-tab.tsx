import { eq, useLiveQuery } from '@tanstack/react-db';

import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { database } from '@colanode/ui/data';

interface WorkspaceTabProps {
  userId: string;
}

export const WorkspaceTab = ({ userId }: WorkspaceTabProps) => {
  const workspaceQuery = useLiveQuery((q) =>
    q
      .from({ workspaces: database.workspaces })
      .where(({ workspaces }) => eq(workspaces.userId, userId))
      .select(({ workspaces }) => ({
        workspaceId: workspaces.workspaceId,
        name: workspaces.name,
        avatar: workspaces.avatar,
      }))
      .findOne()
  );

  const workspace = workspaceQuery.data;
  if (!workspace) {
    return null;
  }

  return (
    <Tab
      id={workspace.workspaceId}
      avatar={workspace.avatar}
      name={workspace.name}
    />
  );
};
