import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceHomeBreadcrumb = () => {
  return <BreadcrumbItem id="home" avatar={defaultIcons.home} name="Home" />;
};
