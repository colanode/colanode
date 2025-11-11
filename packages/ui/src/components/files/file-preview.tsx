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

  const isReady = file.attributes.status === FileStatus.Ready;
  const localFileQuery = useLiveQuery({
    type: 'local.file.get',
    fileId: file.id,
    userId: workspace.userId,
    autoDownload: isReady,
  });

  if (!isReady) {
    return <FileNotUploaded mimeType={file.attributes.mimeType} />;
  }

  if (localFileQuery.isPending) {
    return null;
  }

  const localFile = localFileQuery.data;
  if (!localFile) {
    return <FileNoPreview mimeType={file.attributes.mimeType} />;
  }

  if (localFile.downloadStatus !== DownloadStatus.Completed) {
    return <FileDownloadProgress progress={localFile.downloadProgress} />;
  }

  if (localFile.downloadStatus === DownloadStatus.Completed && localFile.url) {
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

  return <FileNoPreview mimeType={file.attributes.mimeType} />;
};
