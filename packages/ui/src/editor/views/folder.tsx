import { eq, useLiveQuery } from '@tanstack/react-db';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const FolderNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;

  if (!id) {
    return null;
  }

  const folderGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, id))
        .findOne(),
    [workspace.userId, id]
  );

  if (folderGetQuery.isLoading) {
    return null;
  }

  const folder = folderGetQuery.data as LocalFolderNode | undefined;
  if (!folder) {
    return null;
  }

  const name = folder.name ?? 'Unnamed';
  const avatar = folder.avatar;

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
