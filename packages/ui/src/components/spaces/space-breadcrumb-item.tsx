import { LocalSpaceNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface SpaceBreadcrumbItemProps {
  space: LocalSpaceNode;
}

export const SpaceBreadcrumbItem = ({ space }: SpaceBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={space.id}
      avatar={space.attributes.avatar}
      name={space.attributes.name}
    />
  );
};
