import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceMetaTypesBreadcrumb = () => {
  return (
    <BreadcrumbItem
      id="meta-types"
      avatar={defaultIcons.database}
      name="Meta Types"
    />
  );
};
