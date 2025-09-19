import { Link } from '@tanstack/react-router';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const FolderNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;
  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!id) {
    return null;
  }

  if (nodeGetQuery.isPending) {
    return null;
  }

  const folder = nodeGetQuery.data as LocalFolderNode;
  if (!folder) {
    return null;
  }

  const name = folder.attributes.name ?? 'Unnamed';
  const avatar = folder.attributes.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
      <Link
        from="/acc/$accountId/$workspaceId"
        to="$nodeId"
        params={{ nodeId: id }}
        className="my-0.5 flex h-10 w-full cursor-pointer flex-row items-center gap-1 rounded-md p-1 hover:bg-accent"
      >
        <Avatar size="small" id={id} name={name} avatar={avatar} />
        <div role="presentation" className="flex-grow">
          {name}
        </div>
      </Link>
    </NodeViewWrapper>
  );
};
