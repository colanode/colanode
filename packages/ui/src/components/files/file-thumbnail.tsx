import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useFileUrl } from '@colanode/ui/hooks/use-file-url';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  file: LocalFileNode;
  className?: string;
}

export const FileImageThumbnail = ({ file, className }: FileThumbnailProps) => {
  const fileUrl = useFileUrl(file.id, true);

  if (fileUrl.type === 'available') {
    return (
      <img
        src={fileUrl.url}
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
