import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';
import { cn } from '@colanode/ui/lib/utils';

interface TableRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableRenderer = ({ node, keyPrefix }: TableRendererProps) => {
  return (
    <div className="my-2 overflow-x-auto">
      <table className={cn(defaultClasses.table)}>
        <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
      </table>
    </div>
  );
};
