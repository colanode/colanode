import { TabItem } from '@colanode/ui/components/layouts/tabs/tab-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceDownloadsTab = () => {
  return (
    <TabItem id="downloads" avatar={defaultIcons.downloads} name="Downloads" />
  );
};
