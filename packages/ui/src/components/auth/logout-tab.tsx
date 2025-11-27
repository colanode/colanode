import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const LogoutTab = () => {
  return <TabItem id="logout" avatar={defaultIcons.logout} name="Logout" />;
};
