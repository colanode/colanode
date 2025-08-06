import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { cn } from '@colanode/ui/lib/utils';

interface TableCellRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableCellRenderer = ({
  node,
  keyPrefix,
}: TableCellRendererProps) => {
  return (
    <td className={cn(defaultClasses.tableCell)}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </td>
  );
};
