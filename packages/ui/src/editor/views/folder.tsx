import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalFolderNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { NodeLink } from '@colanode/ui/editor/views/node-link';
import { useReferencedNode } from '@colanode/ui/editor/views/use-referenced-node';

export const FolderNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;

  const { node: folder, isLoading } = useReferencedNode<LocalFolderNode>(id);

  if (!id || isLoading || !folder) {
    return null;
  }

  const name = folder.name ?? 'Unnamed';
  const avatar = folder.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
      <NodeLink nodeId={id} nodeType="folder">
        <div className="my-0.5 flex h-10 w-full cursor-pointer flex-row items-center gap-1 rounded-md p-1 hover:bg-accent">
          <Avatar size="small" id={id} name={name} avatar={avatar} />
          <div role="presentation" className="grow">
            {name}
          </div>
        </div>
      </NodeLink>
    </NodeViewWrapper>
  );
};
