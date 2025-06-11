import { match } from 'ts-pattern';

import { LocalFileNode } from '@colanode/client/types';
import { FileDownload } from '@colanode/ui/components/files/file-download';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewOther } from '@colanode/ui/components/files/previews/file-preview-other';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface FilePreviewProps {
  file: LocalFileNode;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const workspace = useWorkspace();

  const fileStateQuery = useQuery({
    type: 'file.state.get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const shouldFetchFileUrl = fileStateQuery.data?.downloadProgress === 100;

  const fileUrlGetQuery = useQuery(
    {
      type: 'file.url.get',
      id: file.id,
      extension: file.attributes.extension,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: shouldFetchFileUrl,
    }
  );

  if (
    fileStateQuery.isPending ||
    (shouldFetchFileUrl && fileUrlGetQuery.isPending)
  ) {
    return null;
  }

  const url = fileUrlGetQuery.data?.url;
  if (fileStateQuery.data?.downloadProgress !== 100 || !url) {
    return <FileDownload file={file} state={fileStateQuery.data} />;
  }

  return match(file.attributes.subtype)
    .with('image', () => (
      <FilePreviewImage url={url} name={file.attributes.name} />
    ))
    .with('video', () => <FilePreviewVideo url={url} />)
    .otherwise(() => <FilePreviewOther mimeType={file.attributes.mimeType} />);
};
