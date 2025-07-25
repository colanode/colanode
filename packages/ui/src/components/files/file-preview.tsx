import { LocalFileNode } from '@colanode/client/types';
import { FileDownloadProgress } from '@colanode/ui/components/files/file-download-progress';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useFileUrl } from '@colanode/ui/hooks/use-file-url';

interface FilePreviewProps {
  file: LocalFileNode;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const fileUrl = useFileUrl(file.id, true);

  if (fileUrl.type === 'downloading') {
    return <FileDownloadProgress progress={fileUrl.progress} />;
  }

  if (fileUrl.type === 'unavailable') {
    return <FileNoPreview mimeType={file.attributes.mimeType} />;
  }

  if (file.attributes.subtype === 'image') {
    return <FilePreviewImage url={fileUrl.url} name={file.attributes.name} />;
  }

  if (file.attributes.subtype === 'video') {
    return <FilePreviewVideo url={fileUrl.url} />;
  }

  if (file.attributes.subtype === 'audio') {
    return <FilePreviewAudio url={fileUrl.url} name={file.attributes.name} />;
  }

  return <FileNoPreview mimeType={file.attributes.mimeType} />;
};
