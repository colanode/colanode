import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceUsersBreadcrumb = () => {
  return <BreadcrumbItem id="users" avatar={defaultIcons.users} name="Users" />;
};
