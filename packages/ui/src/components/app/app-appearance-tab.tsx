import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AppAppearanceTab = () => {
  return (
    <TabItem
      id="appearance"
      avatar={defaultIcons.appearance}
      name="Appearance"
    />
  );
};
