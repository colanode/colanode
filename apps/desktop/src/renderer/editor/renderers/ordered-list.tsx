import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';

interface OrderedListRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const OrderedListRenderer = ({
  node,
  keyPrefix,
}: OrderedListRendererProps) => {
  return (
    <ol className={defaultClasses.orderedList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ol>
  );
};
