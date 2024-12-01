import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { FileBlock } from '@/renderer/components/files/file-block';

export const FileNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;
  if (!id) {
    return null;
  }

  return (
    <NodeViewWrapper>
      <FileBlock id={id} />
    </NodeViewWrapper>
  );
};
