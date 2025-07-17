import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceSettingsTab = () => {
  const workspace = useWorkspace();

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={workspace.id}
        name={workspace.name}
        avatar={workspace.avatar}
        size="small"
      />
      <span>{workspace.name} Settings</span>
    </div>
  );
};
