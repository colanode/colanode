import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceDownloadsHeader = () => {
  return (
    <BreadcrumbItem
      id="downloads"
      avatar={defaultIcons.downloads}
      name="Downloads"
    />
  );
};
