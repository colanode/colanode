import { JSONContent } from '@tiptap/core';

import { FileBlock } from '@/renderer/components/files/file-block';

interface FileRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const FileRenderer = ({ node }: FileRendererProps) => {
  const id = node.attrs?.id;
  if (!id) {
    return null;
  }

  return <FileBlock id={id} />;
};
