import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceStorageHeader = () => {
  return (
    <BreadcrumbItem id="storage" avatar={defaultIcons.storage} name="Storage" />
  );
};
