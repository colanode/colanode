import { JSONContent } from '@tiptap/core';

import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface DocumentRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const DocumentRenderer = ({
  node,
  keyPrefix,
}: DocumentRendererProps) => {
  return <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />;
};
