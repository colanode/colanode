import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceUsersHeader = () => {
  return <BreadcrumbItem id="users" avatar={defaultIcons.users} name="Users" />;
};
