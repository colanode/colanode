import { Settings } from 'lucide-react';

export const AccountSettingsTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <Settings className="size-4" />
      <span>Account Settings</span>
    </div>
  );
};
