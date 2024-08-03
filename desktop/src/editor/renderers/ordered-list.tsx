import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeChildrenRenderer } from '@/editor/renderers/node-children';
import { NodeTree } from '@/types/nodes';

interface OrderedListRendererProps {
  node: NodeTree;
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