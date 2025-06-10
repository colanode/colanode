import { JSONContent } from '@tiptap/core';
import { Fragment } from 'react';

import { NodeRenderer } from '@colanode/ui/editor/renderers/node';

interface NodeChildrenRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const NodeChildrenRenderer = ({
  node,
  keyPrefix,
}: NodeChildrenRendererProps) => {
  if (!node.content || node.content.length === 0) {
    return null;
  }

  return (
    <Fragment>
      {node.content.map((nodeChild, index) => (
        <NodeRenderer
          node={nodeChild}
          keyPrefix={`${keyPrefix}-${index}`}
          key={`${keyPrefix}-${index}`}
        />
      ))}
    </Fragment>
  );
};
