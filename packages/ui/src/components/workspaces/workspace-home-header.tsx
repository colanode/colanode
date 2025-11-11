import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const WorkspaceHomeHeader = () => {
  return <BreadcrumbItem id="home" avatar={defaultIcons.home} name="Home" />;
};
