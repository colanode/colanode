import { LocalSpaceNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface SpaceBreadcrumbItemProps {
  space: LocalSpaceNode;
}

export const SpaceBreadcrumbItem = ({ space }: SpaceBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={space.id}
        name={space.attributes.name}
        avatar={space.attributes.avatar}
        className="size-4"
      />
      <span>{space.attributes.name}</span>
    </div>
  );
};
