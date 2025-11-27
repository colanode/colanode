import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AccountSettingsTab = () => {
  return (
    <TabItem
      id="settings"
      avatar={defaultIcons.settings}
      name="Account Settings"
    />
  );
};
