import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface PageBreadcrumbItemProps {
  page: LocalPageNode;
}

export const PageBreadcrumbItem = ({ page }: PageBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={page.id}
          name={page.attributes.name}
          avatar={page.attributes.avatar}
          className={className}
        />
      )}
      name={page.attributes.name}
    />
  );
};
