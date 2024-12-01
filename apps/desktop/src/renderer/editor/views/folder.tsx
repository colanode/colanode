import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const FolderNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const id = node.attrs.id;
  const { data } = useQuery({
    type: 'node_get',
    nodeId: id,
    userId: workspace.userId,
  });

  if (!id) {
    return null;
  }

  if (data?.attributes.type !== 'folder') {
    return null;
  }

  const name = data.attributes.name ?? 'Unnamed';
  const avatar = data?.attributes.avatar;

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className="my-0.5 flex h-12 w-full cursor-pointer flex-row items-center gap-1 rounded-md bg-gray-50 p-2 hover:bg-gray-100"
      onClick={() => {
        workspace.openInMain(id);
      }}
    >
      <Avatar size="small" id={id} name={name} avatar={avatar} />
      <div role="presentation" className="flex-grow">
        {name}
      </div>
    </NodeViewWrapper>
  );
};
