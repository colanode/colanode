import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';

interface Heading1RendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const Heading1Renderer = ({
  node,
  keyPrefix,
}: Heading1RendererProps) => {
  return (
    <h1 className={defaultClasses.heading1}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </h1>
  );
};
