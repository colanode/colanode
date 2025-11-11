import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceUsersTab = () => {
  return <TabItem id="users" avatar={defaultIcons.users} name="Users" />;
};
