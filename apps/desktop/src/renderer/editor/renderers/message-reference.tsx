import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface MessageReferenceRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const MessageReferenceRenderer = ({
  node,
  keyPrefix,
}: MessageReferenceRendererProps) => {
  return (
    <div className="items-top flex flex-col gap-2 border-l-4 p-2 text-sm text-foreground">
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </div>
  );
};
