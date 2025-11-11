import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AppAppearanceSettingsBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="appearance"
      avatar={defaultIcons.appearance}
      name="Appearance"
    />
  );
};
