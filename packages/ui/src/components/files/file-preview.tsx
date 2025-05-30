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

  const { data, isPending } = useQuery({
    type: 'file_state_get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const { data: urlData } = useQuery(
    {
      type: 'file_url_get',
      id: file.id,
      extension: file.attributes.extension,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: data?.downloadProgress === 100,
    }
  );

  if (isPending) {
    return null;
  }

  const url = urlData?.url;
  if (data?.downloadProgress !== 100 || !url) {
    return <FileDownload file={file} state={data} />;
  }

  return match(file.attributes.subtype)
    .with('image', () => (
      <FilePreviewImage url={url} name={file.attributes.name} />
    ))
    .with('video', () => <FilePreviewVideo url={url} />)
    .otherwise(() => <FilePreviewOther mimeType={file.attributes.mimeType} />);
};
