import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceSettingsBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="settings"
      avatar={defaultIcons.settings}
      name="Settings"
    />
  );
};
