import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { NodeLink } from '@colanode/ui/editor/views/node-link';
import { useReferencedNode } from '@colanode/ui/editor/views/use-referenced-node';

export const PageNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;

  const { node: page, isLoading } = useReferencedNode<LocalPageNode>(id);

  if (!id || isLoading || !page || page.type !== 'page') {
    return null;
  }

  const name = page.name ?? 'Unnamed';
  const avatar = page.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
      <NodeLink nodeId={id} nodeType="page">
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
