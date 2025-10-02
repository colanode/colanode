import { LocalFileNode } from '@colanode/client/types';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => <FileThumbnail file={file} className={className} />}
      name={file.attributes.name}
    />
  );
};
