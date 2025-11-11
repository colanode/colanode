import { LocalSpaceNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface SpaceBreadcrumbItemProps {
  space: LocalSpaceNode;
}

export const SpaceBreadcrumbItem = ({ space }: SpaceBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={space.id}
          name={space.attributes.name}
          avatar={space.attributes.avatar}
          className={className}
        />
      )}
      name={space.attributes.name}
    />
  );
};
