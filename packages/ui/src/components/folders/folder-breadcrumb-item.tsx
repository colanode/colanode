import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface FolderBreadcrumbItemProps {
  folder: LocalFolderNode;
}

export const FolderBreadcrumbItem = ({ folder }: FolderBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={folder.id}
        name={folder.attributes.name}
        avatar={folder.attributes.avatar}
        className="size-4"
      />
      <span>{folder.attributes.name}</span>
    </div>
  );
};
