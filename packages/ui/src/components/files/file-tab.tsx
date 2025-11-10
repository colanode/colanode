import { LocalFileNode } from '@colanode/client/types';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';

interface FileTabProps {
  userId: string;
  file: LocalFileNode;
}

export const FileTab = ({ userId, file }: FileTabProps) => {
  const name =
    file.attributes.name && file.attributes.name.length > 0
      ? file.attributes.name
      : 'Untitled';

  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail
        userId={userId}
        file={file}
        className="size-4 rounded object-contain"
      />
      <span>{name}</span>
    </div>
  );
};
