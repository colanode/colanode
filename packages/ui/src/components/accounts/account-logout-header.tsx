import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const AccountLogoutHeader = () => {
  return (
    <BreadcrumbItem id="logout" avatar={defaultIcons.logout} name="Logout" />
  );
};
