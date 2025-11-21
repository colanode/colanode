import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  userId: string;
  file: LocalFileNode;
  className?: string;
}

export const FileImageThumbnail = ({
  userId,
  file,
  className,
}: FileThumbnailProps) => {
  const localFileQuery = useLiveQuery({
    type: 'local.file.get',
    fileId: file.id,
    userId: userId,
  });

  if (localFileQuery.isPending) {
    return null;
  }

  const localFile = localFileQuery.data;
  if (
    localFile &&
    localFile.downloadStatus === DownloadStatus.Completed &&
    localFile.url
  ) {
    return (
      <img
        src={localFile.url}
        alt={file.name}
        className={cn('size-10 object-contain object-center', className)}
      />
    );
  }

  return (
    <FileIcon mimeType={file.mimeType} className={cn('size-10', className)} />
  );
};

export const FileThumbnail = ({
  userId,
  file,
  className,
}: FileThumbnailProps) => {
  if (file.subtype === 'image') {
    return (
      <FileImageThumbnail userId={userId} file={file} className={className} />
    );
  }

  return (
    <FileIcon mimeType={file.mimeType} className={cn('size-10', className)} />
  );
};
