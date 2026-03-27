import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { Database } from 'lucide-react';
import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { useNode } from '@colanode/ui/contexts/node';

import { MobileDatabaseRuntime } from '../database-runtime';
import { postNavigateNode } from '../bridge';

const MobileDatabaseCard = ({ id }: { id: string }) => {
  const { node } = useNode<LocalDatabaseNode>();

  if (!node || node.type !== 'database') {
    return null;
  }

  return (
    <NodeViewWrapper data-id={id}>
      <div
        className="my-0.5 flex h-10 w-full cursor-pointer flex-row items-center gap-2 rounded-md p-2 hover:bg-accent active:bg-accent"
        onClick={() => postNavigateNode(id, 'database')}
      >
        <Database size={18} className="text-muted-foreground shrink-0" />
        <span className="truncate">{node.name || 'Unnamed database'}</span>
      </div>
    </NodeViewWrapper>
  );
};

export const MobileDatabaseNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;
  const isInline = Boolean(node.attrs.inline);

  if (!id) return null;

  if (isInline) {
    return (
      <NodeViewWrapper
        data-id={node.attrs.id}
        className="my-4 w-full"
        contentEditable={false}
        onDragStart={(event: React.DragEvent<HTMLDivElement>) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <MobileDatabaseRuntime databaseId={id} inline />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeProvider nodeId={id}>
      <MobileDatabaseCard id={id} />
    </NodeProvider>
  );
};
