import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';
import { match } from 'ts-pattern';

import { TempFile } from '@colanode/client/types';
import { FilePreviewImage } from '@colanode/ui/components/files/previews/file-preview-image';
import { FilePreviewOther } from '@colanode/ui/components/files/previews/file-preview-other';
import { FilePreviewVideo } from '@colanode/ui/components/files/previews/file-preview-video';

export const TempFileNodeView = ({ node, deleteNode }: NodeViewProps) => {
  const file = node.attrs as TempFile;

  if (!file) {
    return null;
  }

  const mimeType = file.mimeType;
  const name = file.name;
  const type = file.type;

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="flex h-72 max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
    >
      <div className="group/temp-file relative">
        <button
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover/temp-file:opacity-100 cursor-pointer"
          onClick={deleteNode}
        >
          <X className="size-4" />
        </button>
        {match(type)
          .with('image', () => <FilePreviewImage url={file.url} name={name} />)
          .with('video', () => <FilePreviewVideo url={file.url} />)
          .with('other', () => <FilePreviewOther mimeType={mimeType} />)
          .otherwise(() => null)}
      </div>
    </NodeViewWrapper>
  );
};
