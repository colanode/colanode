import { LocalFolderNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface FolderBreadcrumbItemProps {
  folder: LocalFolderNode;
}

export const FolderBreadcrumbItem = ({ folder }: FolderBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={folder.id}
      avatar={folder.attributes.avatar}
      name={folder.attributes.name}
    />
  );
};
