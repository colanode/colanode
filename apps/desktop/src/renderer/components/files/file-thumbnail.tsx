import { getFileUrl } from '@/shared/lib/files';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { FileIcon } from '@/renderer/components/files/file-icon';
import { cn } from '@/shared/lib/utils';
import { FileNode } from '@colanode/core';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileThumbnailProps {
  file: FileNode;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'download_get',
    nodeId: file.id,
    userId: workspace.userId,
  });

  if (
    file.attributes.subtype === 'image' &&
    data &&
    data.progress === 100 &&
    data.uploadId === file.attributes.uploadId
  ) {
    const url = getFileUrl(
      workspace.userId,
      file.id,
      file.attributes.uploadId,
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

  return <FileIcon mimeType={file.attributes.mimeType} className="size-10" />;
};
