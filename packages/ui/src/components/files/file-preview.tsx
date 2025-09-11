import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';
import { FileDownloadProgress } from '@colanode/ui/components/files/file-download-progress';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FileNotUploaded } from '@colanode/ui/components/files/file-not-uploaded';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface FilePreviewProps {
  file: LocalFileNode;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const workspace = useWorkspace();
  const localFileQuery = useLiveQuery({
    type: 'local.file.get',
    fileId: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    autoDownload: true,
  });

  if (localFileQuery.isPending) {
    return null;
  }

  const localFile = localFileQuery.data?.localFile;
  if (localFile) {
    if (file.attributes.subtype === 'image') {
      return (
        <FilePreviewImage url={localFile.url} name={file.attributes.name} />
      );
    }

    if (file.attributes.subtype === 'video') {
      return <FilePreviewVideo url={localFile.url} />;
    }

    if (file.attributes.subtype === 'audio') {
      return (
        <FilePreviewAudio url={localFile.url} name={file.attributes.name} />
      );
    }
  }

  const download = localFileQuery.data?.download;
  if (download && download.status !== DownloadStatus.Completed) {
    return <FileDownloadProgress progress={download.progress} />;
  }

  const isReady = file.attributes.status === FileStatus.Ready;
  if (!isReady) {
    return <FileNotUploaded mimeType={file.attributes.mimeType} />;
  }

  return <FileNoPreview mimeType={file.attributes.mimeType} />;
};
