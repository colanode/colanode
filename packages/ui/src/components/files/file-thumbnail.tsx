import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { getFileUrl } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  file: LocalFileNode;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'file_state_get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (file.attributes.subtype === 'image' && data?.downloadProgress === 100) {
    const url = getFileUrl(
      workspace.accountId,
      workspace.id,
      file.id,
      file.attributes.extension
    );

    return (
      <img
        src={url}
        alt={file.attributes.name}
        className={cn('object-contain object-center', className)}
      />
    );
  }

  return (
    <FileIcon
      mimeType={file.attributes.mimeType}
      className={cn('size-10', className)}
    />
  );
};
