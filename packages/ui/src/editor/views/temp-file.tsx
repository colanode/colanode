import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';

import { TempFile } from '@colanode/client/types';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { canPreviewFile } from '@colanode/ui/lib/files';

const TempFilePreview = ({ file }: { file: TempFile }) => {
  if (file.subtype === 'image') {
    return <FilePreviewImage url={file.url} name={file.name} />;
  }

  if (file.subtype === 'video') {
    return <FilePreviewVideo url={file.url} />;
  }

  if (file.subtype === 'audio') {
    return <FilePreviewAudio url={file.url} />;
  }

  return <FileNoPreview mimeType={file.mimeType} />;
};

export const TempFileNodeView = ({ node, deleteNode }: NodeViewProps) => {
  const fileId = node.attrs.id;

  const tempFileQuery = useLiveQuery(
    {
      type: 'temp.file.get',
      id: fileId,
    },
    {
      enabled: !!fileId,
    }
  );

  if (!fileId || tempFileQuery.isPending || !tempFileQuery.data) {
    return null;
  }

  const tempFile = tempFileQuery.data;
  const mimeType = tempFile.mimeType;
  const subtype = tempFile.subtype;
  const canPreview = canPreviewFile(subtype);

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="flex max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
    >
      <div className="group/temp-file relative">
        <button
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover/temp-file:opacity-100 cursor-pointer"
          onClick={deleteNode}
        >
          <X className="size-4" />
        </button>
        {canPreview ? (
          <TempFilePreview file={tempFile} />
        ) : (
          <FileNoPreview mimeType={mimeType} />
        )}
      </div>
    </NodeViewWrapper>
  );
};
