import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

interface FileThumbnailProps {
  file: LocalFileNode;
  className?: string;
}

export const FileThumbnail = ({ file, className }: FileThumbnailProps) => {
  const workspace = useWorkspace();

  const fileStateGetQuery = useQuery({
    type: 'file.state.get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const fileUrlGetQuery = useQuery(
    {
      type: 'file.url.get',
      id: file.id,
      extension: file.attributes.extension,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: fileStateGetQuery.data?.downloadProgress === 100,
    }
  );

  const url = fileUrlGetQuery.data?.url;

  if (
    file.attributes.subtype === 'image' &&
    fileStateGetQuery.data?.downloadProgress === 100 &&
    url
  ) {
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
