import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  file: LocalFileNode;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();

  const fileStateGetQuery = useLiveQuery({
    type: 'file.state.get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (
    file.attributes.subtype === 'image' &&
    fileStateGetQuery.data?.downloadProgress === 100 &&
    fileStateGetQuery.data?.url
  ) {
    return (
      <img
        src={fileStateGetQuery.data?.url}
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
