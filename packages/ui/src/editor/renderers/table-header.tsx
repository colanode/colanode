import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface TableHeaderRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableHeaderRenderer = ({
  node,
  keyPrefix,
}: TableHeaderRendererProps) => {
  return (
    <th className={defaultClasses.tableHeaderWrapper}>
      <div className={defaultClasses.tableHeader}>
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </div>
    </th>
  );
};
