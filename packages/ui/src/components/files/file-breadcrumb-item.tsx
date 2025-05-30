import { LocalFileNode } from '@colanode/client/types';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail
        file={file}
        className="size-4 overflow-hidden rounded object-contain"
      />
      <span>{file.attributes.name}</span>
    </div>
  );
};
