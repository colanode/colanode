import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AccountSettingsBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="settings"
      avatar={defaultIcons.settings}
      name="Account Settings"
    />
  );
};
