import { eq, useLiveQuery } from '@tanstack/react-db';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';

import { FileSubtype } from '@colanode/core';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreviewAudio } from '@colanode/ui/components/files/previews/file-preview-audio';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';
import { database } from '@colanode/ui/data';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface TempFilePreviewProps {
  name: string;
  mimeType: string;
  subtype: FileSubtype;
  url: string;
}

const TempFilePreview = ({
  name,
  mimeType,
  subtype,
  url,
}: TempFilePreviewProps) => {
  if (subtype === 'image') {
    return <FilePreviewImage url={url} name={name} />;
  }

  if (subtype === 'video') {
    return <FilePreviewVideo url={url} />;
  }

  if (subtype === 'audio') {
    return <FilePreviewAudio url={url} />;
  }

  return <FileNoPreview mimeType={mimeType} />;
};

export const TempFileNodeView = ({ node, deleteNode }: NodeViewProps) => {
  const fileId = node.attrs.id;

  const tempFileQuery = useLiveQuery((q) =>
    q
      .from({ tempFiles: database.tempFiles })
      .where(({ tempFiles }) => eq(tempFiles.id, fileId))
      .select(({ tempFiles }) => ({
        name: tempFiles.name,
        mimeType: tempFiles.mimeType,
        subtype: tempFiles.subtype,
        url: tempFiles.url,
      }))
      .findOne()
  );

  const tempFile = tempFileQuery.data;
  if (!fileId || !tempFile) {
    return null;
  }

  const mimeType = tempFile.mimeType;
  const subtype = tempFile.subtype;
  const canPreview = canPreviewFile(subtype);

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="flex max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-accent"
    >
      <div className="group/temp-file relative">
        <button
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover/temp-file:opacity-100 cursor-pointer"
          onClick={deleteNode}
        >
          <X className="size-4" />
        </button>
        {canPreview ? (
          <TempFilePreview
            name={tempFile.name}
            mimeType={tempFile.mimeType}
            subtype={tempFile.subtype}
            url={tempFile.url}
          />
        ) : (
          <FileNoPreview mimeType={mimeType} />
        )}
      </div>
    </NodeViewWrapper>
  );
};
