import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';

interface Heading3RendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const Heading3Renderer = ({
  node,
  keyPrefix,
}: Heading3RendererProps) => {
  return (
    <h3 className={defaultClasses.heading3}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </h3>
  );
};
