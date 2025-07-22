import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';

export const DatabaseNodeView = ({ node }: NodeViewProps) => {
  const layout = useLayout();

  const id = node.attrs.id;
  const data = useNodeContainer<LocalDatabaseNode>(id);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return null;
  }

  const { node: database, role } = data;
  if (node.attrs.inline) {
    return (
      <NodeViewWrapper data-id={node.attrs.id} className="my-4 w-full">
        <Database database={database} role={role}>
          <DatabaseViews inline />
        </Database>
      </NodeViewWrapper>
    );
  }

  const name = database.attributes.name ?? 'Unnamed';
  const avatar = database.attributes.avatar;

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="my-0.5 w-full cursor-pointer flex-row items-center gap-1 rounded-md bg-gray-50 p-2 hover:bg-gray-100"
      onClick={() => {
        layout.previewLeft(id, true);
      }}
    >
      <Avatar size="small" id={id} name={name} avatar={avatar} />
      <div role="presentation" className="flex-grow">
        {name}
      </div>
    </NodeViewWrapper>
  );
};
