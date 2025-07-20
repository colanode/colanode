import { useEffect } from 'react';

import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileDownloadProgress } from '@colanode/ui/components/files/file-download-progress';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface FilePreviewProps {
  file: LocalFileNode;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const workspace = useWorkspace();
  const mutation = useMutation();

  const fileStateQuery = useLiveQuery({
    type: 'file.state.get',
    id: file.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const isDownloading =
    fileStateQuery.data?.downloadStatus === DownloadStatus.Pending;
  const isDownloaded =
    fileStateQuery.data?.downloadStatus === DownloadStatus.Completed;

  useEffect(() => {
    if (!fileStateQuery.isPending && !isDownloaded && !isDownloading) {
      mutation.mutate({
        input: {
          type: 'file.download',
          accountId: workspace.accountId,
          workspaceId: workspace.id,
          fileId: file.id,
          path: null,
        },
        onError: (error) => {
          console.error('Failed to start file download:', error.message);
        },
      });
    }
  }, [
    fileStateQuery.isPending,
    isDownloaded,
    isDownloading,
    mutation,
    workspace.accountId,
    workspace.id,
    file.id,
  ]);

  if (fileStateQuery.isPending) {
    return null;
  }

  if (isDownloading) {
    return <FileDownloadProgress state={fileStateQuery.data} />;
  }

  const url = fileStateQuery.data?.url;
  if (!url) {
    return <FileNoPreview mimeType={file.attributes.mimeType} />;
  }

  if (file.attributes.subtype === 'image') {
    return <FilePreviewImage url={url} name={file.attributes.name} />;
  }

  if (file.attributes.subtype === 'video') {
    return <FilePreviewVideo url={url} />;
  }

  if (file.attributes.subtype === 'audio') {
    return <FilePreviewAudio url={url} name={file.attributes.name} />;
  }

  return <FileNoPreview mimeType={file.attributes.mimeType} />;
};
