import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  file: LocalFileNode;
  className?: string;
}

export const FileImageThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();
  const localFileQuery = useLiveQuery({
    type: 'local.file.get',
    fileId: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (localFileQuery.isPending) {
    return null;
  }

  const localFile = localFileQuery.data?.localFile;
  if (localFile) {
    return (
      <img
        src={localFile.url}
        alt={file.attributes.name}
        className={cn('size-10 object-contain object-center', className)}
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

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  if (file.attributes.subtype === 'image') {
    return <FileImageThumbnail file={file} className={className} />;
  }

  return (
    <FileIcon
      mimeType={file.attributes.mimeType}
      className={cn('size-10', className)}
    />
  );
};
