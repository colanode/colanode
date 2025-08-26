import { Palette } from 'lucide-react';

export const AppAppearanceSettingsTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <Palette className="size-4" />
      <span>Appearance</span>
    </div>
  );
};
