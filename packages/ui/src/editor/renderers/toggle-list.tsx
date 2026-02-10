import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface ToggleListRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const ToggleListRenderer = ({
  node,
  keyPrefix,
}: ToggleListRendererProps) => {
  return (
    <div className={defaultClasses.toggleList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </div>
  );
};