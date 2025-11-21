import { eq, useLiveQuery } from '@tanstack/react-db';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const PageNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;

  if (!id) {
    return null;
  }

  const pageGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ pages: workspace.collections.pages })
        .where(({ pages }) => eq(pages.id, id))
        .select(({ pages }) => ({
          id: pages.id,
          name: pages.name,
          avatar: pages.avatar,
        }))
        .findOne(),
    [workspace.userId, id]
  );

  if (pageGetQuery.isLoading) {
    return null;
  }

  const page = pageGetQuery.data;
  if (!page) {
    return null;
  }

  const name = page.name ?? 'Unnamed';
  const avatar = page.avatar;

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
