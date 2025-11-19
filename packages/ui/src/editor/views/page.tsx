import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const PageNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;
  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: id,
    userId: workspace.userId,
  });

  if (!id) {
    return null;
  }

  if (nodeGetQuery.isPending) {
    return null;
  }

  const page = nodeGetQuery.data as LocalPageNode;
  if (!page) {
    return null;
  }

  const name = page.attributes.name ?? 'Unnamed';
  const avatar = page.attributes.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
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
