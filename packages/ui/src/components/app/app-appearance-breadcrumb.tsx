import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AppAppearanceBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="appearance"
      avatar={defaultIcons.appearance}
      name="Appearance"
    />
  );
};
