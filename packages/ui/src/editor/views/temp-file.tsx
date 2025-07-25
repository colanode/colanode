import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';

import { TempFile } from '@colanode/client/types';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { useApp } from '@colanode/ui/contexts/app';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { canPreviewFile } from '@colanode/ui/lib/files';

const TempFilePreview = ({ file }: { file: TempFile }) => {
  const app = useApp();

  const mimeType = file.mimeType;
  const name = file.name;
  const type = file.type;

  const blobUrlQuery = useLiveQuery(
    {
      type: 'blob.url.get',
      path: file.path,
    },
    {
      enabled: app.type === 'web',
    }
  );

  const url =
    app.type === 'web' ? blobUrlQuery.data : `local://temp/${file.name}`;

  if (!url) {
    return <FileNoPreview mimeType={mimeType} />;
  }

  if (type === 'image') {
    return <FilePreviewImage url={url} name={name} />;
  }

  if (type === 'video') {
    return <FilePreviewVideo url={url} />;
  }

  if (type === 'audio') {
    return <FilePreviewAudio url={url} />;
  }

  return <FileNoPreview mimeType={mimeType} />;
};

export const TempFileNodeView = ({ node, deleteNode }: NodeViewProps) => {
  const file = node.attrs as TempFile;

  if (!file) {
    return null;
  }

  const mimeType = file.mimeType;
  const type = file.type;
  const canPreview = canPreviewFile(type);

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
          <TempFilePreview file={file} />
        ) : (
          <FileNoPreview mimeType={mimeType} />
        )}
      </div>
    </NodeViewWrapper>
  );
};
