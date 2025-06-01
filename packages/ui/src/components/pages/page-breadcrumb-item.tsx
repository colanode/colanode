import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface PageBreadcrumbItemProps {
  page: LocalPageNode;
}

export const PageBreadcrumbItem = ({ page }: PageBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={page.id}
        name={page.attributes.name}
        avatar={page.attributes.avatar}
        className="size-4"
      />
      <span>{page.attributes.name}</span>
    </div>
  );
};
