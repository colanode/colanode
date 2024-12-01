import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { X } from 'lucide-react';
import { match } from 'ts-pattern';

import { FilePreviewImage } from '@/renderer/components/files/previews/file-preview-image';
import { FilePreviewOther } from '@/renderer/components/files/previews/file-preview-other';
import { FilePreviewVideo } from '@/renderer/components/files/previews/file-preview-video';
import { getFilePlaceholderUrl } from '@/shared/lib/files';

export const FilePlaceholderNodeView = ({
  node,
  deleteNode,
}: NodeViewProps) => {
  const path = node.attrs.path;
  const mimeType = node.attrs.mimeType;
  const name = node.attrs.name;
  const type = node.attrs.type;

  if (!path || !mimeType) {
    return null;
  }

  const url = getFilePlaceholderUrl(path);
  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="flex h-72 max-h-72 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
    >
      <div className="group/file-placeholder relative">
        <button
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover/file-placeholder:opacity-100"
          onClick={deleteNode}
        >
          <X className="size-4" />
        </button>
        {match(type)
          .with('image', () => <FilePreviewImage url={url} name={name} />)
          .with('video', () => <FilePreviewVideo url={url} />)
          .with('other', () => <FilePreviewOther mimeType={mimeType} />)
          .otherwise(() => null)}
      </div>
    </NodeViewWrapper>
  );
};
