import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb-item';

interface FolderBreadcrumbItemProps {
  folder: LocalFolderNode;
}

export const FolderBreadcrumbItem = ({ folder }: FolderBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={folder.id}
          name={folder.attributes.name}
          avatar={folder.attributes.avatar}
          className={className}
        />
      )}
      name={folder.attributes.name}
    />
  );
};
