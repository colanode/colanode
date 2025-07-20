import { Settings } from 'lucide-react';

export const WorkspaceSettingsTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <Settings className="size-4" />
      <span>Workspace Settings</span>
    </div>
  );
};
