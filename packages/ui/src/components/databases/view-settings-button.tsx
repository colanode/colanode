import { Settings } from 'lucide-react';

export const ViewSettingsButton = () => {
  return (
    <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
      <Settings className="size-4" />
    </div>
  );
};
