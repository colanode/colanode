import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const InfoBreadcrumb = () => {
  return (
    <BreadcrumbItem id="info" avatar={defaultIcons.apps} name="Info" />
  );
};
