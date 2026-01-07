import { LocalPageNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';

interface PageBreadcrumbItemProps {
  page: LocalPageNode;
}

export const PageBreadcrumbItem = ({ page }: PageBreadcrumbItemProps) => {
  return <BreadcrumbItem id={page.id} avatar={page.avatar} name={page.name} />;
};
