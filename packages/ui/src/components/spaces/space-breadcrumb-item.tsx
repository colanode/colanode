import { LocalSpaceNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';

interface SpaceBreadcrumbItemProps {
  space: LocalSpaceNode;
}

export const SpaceBreadcrumbItem = ({ space }: SpaceBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem id={space.id} avatar={space.avatar} name={space.name} />
  );
};
