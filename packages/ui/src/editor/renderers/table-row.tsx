import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { cn } from '@colanode/ui/lib/utils';

interface TableRowRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableRowRenderer = ({
  node,
  keyPrefix,
}: TableRowRendererProps) => {
  return (
    <tr className={cn(defaultClasses.tableRow)}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </tr>
  );
};
