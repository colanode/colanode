import { LocalFileNode } from '@colanode/client/types';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  const workspace = useWorkspace();
  return (
    <BreadcrumbItem
      icon={(className) => (
        <FileThumbnail
          userId={workspace.userId}
          file={file}
          className={className}
        />
      )}
      name={file.attributes.name}
    />
  );
};
