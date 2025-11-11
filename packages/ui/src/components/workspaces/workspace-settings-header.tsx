import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceSettingsHeader = () => {
  return (
    <BreadcrumbItem
      id="settings"
      avatar={defaultIcons.settings}
      name="Settings"
    />
  );
};
