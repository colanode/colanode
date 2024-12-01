import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';

interface BulletListRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const BulletListRenderer = ({
  node,
  keyPrefix,
}: BulletListRendererProps) => {
  return (
    <ul className={defaultClasses.bulletList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ul>
  );
};
