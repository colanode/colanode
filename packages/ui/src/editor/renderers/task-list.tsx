import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface TaskListRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TaskListRenderer = ({
  node,
  keyPrefix,
}: TaskListRendererProps) => {
  return (
    <ul className={defaultClasses.taskList}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </ul>
  );
};
