import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceDownloadsBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="downloads"
      avatar={defaultIcons.downloads}
      name="Downloads"
    />
  );
};
