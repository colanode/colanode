import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceTagsBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="tags"
      avatar={defaultIcons.bookmark}
      name="Tags"
    />
  );
};
