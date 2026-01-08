import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { Link } from '@colanode/ui/components/ui/link';
import { useNode } from '@colanode/ui/contexts/node';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';

const DatabaseNodeViewInline = ({ id }: { id: string }) => {
  const workspace = useWorkspace();
  const { node: database, role } = useNode<LocalDatabaseNode>();
  const [activeViewId, setActiveViewId] = useMetadata<string>(
    workspace.userId,
    `${database.id}.activeViewId`
  );

  return (
    <NodeViewWrapper
      data-id={id}
      className="my-4 w-full"
      contentEditable={false}
      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Database database={database} role={role}>
        <DatabaseViews
          inline
          viewId={activeViewId}
          onViewChange={setActiveViewId}
        />
      </Database>
    </NodeViewWrapper>
  );
};

const DatabaseNodeViewLink = ({ id }: { id: string }) => {
  const { node: database } = useNode<LocalDatabaseNode>();

  const name = database.name ?? 'Unnamed';
  const avatar = database.avatar;

  return (
    <NodeViewWrapper data-id={id}>
      <Link from="/workspace/$userId" to="$nodeId" params={{ nodeId: id }}>
        <div className="my-0.5 flex h-10 w-full cursor-pointer flex-row items-center gap-1 rounded-md p-1 hover:bg-accent">
          <Avatar size="small" id={id} name={name} avatar={avatar} />
          <div role="presentation" className="grow">
            {name}
          </div>
        </div>
      </Link>
    </NodeViewWrapper>
  );
};

export const DatabaseNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;
  return (
    <NodeProvider nodeId={id}>
      {node.attrs.inline ? (
        <DatabaseNodeViewInline id={id} />
      ) : (
        <DatabaseNodeViewLink id={id} />
      )}
    </NodeProvider>
  );
};
