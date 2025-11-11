import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AccountLogoutBreadcrumb = () => {
  return (
    <BreadcrumbItem id="logout" avatar={defaultIcons.logout} name="Logout" />
  );
};
