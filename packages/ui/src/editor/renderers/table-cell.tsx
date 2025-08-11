import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { editorColors } from '@colanode/ui/lib/editor';
import { cn } from '@colanode/ui/lib/utils';

interface TableCellRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableCellRenderer = ({
  node,
  keyPrefix,
}: TableCellRendererProps) => {
  const align = node.attrs?.align ?? 'left';
  const backgroundColorAttr = node.attrs?.backgroundColor ?? null;
  const backgroundColor = backgroundColorAttr
    ? editorColors.find((color) => color.color === backgroundColorAttr)
    : null;

  return (
    <td className={defaultClasses.tableCellWrapper}>
      <div
        className={cn(
          defaultClasses.tableCell,
          backgroundColor?.bgClass,
          align === 'left' && 'justify-start',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}
      >
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </div>
    </td>
  );
};
