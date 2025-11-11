import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const NodeScreenBreadcrumb = () => {
  return <BreadcrumbItem id="node" avatar={defaultIcons.error} name="Error" />;
};
