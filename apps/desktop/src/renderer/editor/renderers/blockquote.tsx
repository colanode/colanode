import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';

interface BlockquoteRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const BlockquoteRenderer = ({
  node,
  keyPrefix,
}: BlockquoteRendererProps) => {
  return (
    <blockquote className={defaultClasses.blockquote}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </blockquote>
  );
};
