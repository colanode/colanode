import { LocalPageNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface PageBreadcrumbItemProps {
  page: LocalPageNode;
}

export const PageBreadcrumbItem = ({ page }: PageBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={page.id}
      avatar={page.attributes.avatar}
      name={page.attributes.name}
    />
  );
};
