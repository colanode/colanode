import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { cn } from '@colanode/ui/lib/utils';

interface TableHeaderRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableHeaderRenderer = ({
  node,
  keyPrefix,
}: TableHeaderRendererProps) => {
  return (
    <th className={cn(defaultClasses.tableHeader)}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </th>
  );
};
