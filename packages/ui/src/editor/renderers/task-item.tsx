import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface TaskItemRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TaskItemRenderer = ({
  node,
  keyPrefix,
}: TaskItemRendererProps) => {
  return (
    <li className={defaultClasses.taskItem}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </li>
  );
};
