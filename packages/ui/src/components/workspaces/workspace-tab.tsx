import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { useAppStore } from '@colanode/ui/stores/app';

interface WorkspaceTabProps {
  accountId: string;
  workspaceId: string;
}

export const WorkspaceTab = ({ accountId, workspaceId }: WorkspaceTabProps) => {
  const workspace = useAppStore(
    (state) => state.accounts[accountId]?.workspaces[workspaceId]
  );

  if (!workspace) {
    return null;
  }

  return (
    <Tab id={workspace.id} avatar={workspace.avatar} name={workspace.name} />
  );
};
