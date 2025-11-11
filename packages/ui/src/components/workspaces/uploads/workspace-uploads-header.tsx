import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceUploadsHeader = () => {
  return (
    <BreadcrumbItem id="uploads" avatar={defaultIcons.uploads} name="Uploads" />
  );
};
