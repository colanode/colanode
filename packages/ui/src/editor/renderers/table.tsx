import { JSONContent } from '@tiptap/core';

import { defaultClasses } from '@colanode/ui/editor/classes';
import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface TableRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TableRenderer = ({ node, keyPrefix }: TableRendererProps) => {
  return (
    <table className={defaultClasses.table}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </table>
  );
};
