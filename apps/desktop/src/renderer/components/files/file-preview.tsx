import { FileNode } from '@colanode/core';
import { match } from 'ts-pattern';

import { FileDownload } from '@/renderer/components/files/file-download';
import { FilePreviewImage } from '@/renderer/components/files/previews/file-preview-image';
import { FilePreviewOther } from '@/renderer/components/files/previews/file-preview-other';
import { FilePreviewVideo } from '@/renderer/components/files/previews/file-preview-video';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { getFileUrl } from '@/shared/lib/files';

interface FilePreviewProps {
  file: FileNode;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'download_get',
    nodeId: file.id,
    userId: workspace.userId,
  });

  if (!data || data.progress !== 100) {
    return <FileDownload id={file.id} downloadProgress={data?.progress} />;
  }

  const url = getFileUrl(
    workspace.userId,
    file.id,
    file.attributes.uploadId,
    file.attributes.extension
  );

  return match(file.attributes.subtype)
    .with('image', () => (
      <FilePreviewImage url={url} name={file.attributes.name} />
    ))
    .with('video', () => <FilePreviewVideo url={url} />)
    .with('other', () => (
      <FilePreviewOther mimeType={file.attributes.mimeType} />
    ))
    .otherwise(() => null);
};
