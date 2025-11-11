import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceStorageBreadcrumb = () => {
  return (
    <BreadcrumbItem id="storage" avatar={defaultIcons.storage} name="Storage" />
  );
};
