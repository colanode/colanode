import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { defaultClasses } from '@colanode/ui/editor/classes';
import { useReferencedUser } from '@colanode/ui/editor/views/use-referenced-user';

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const target = node.attrs.target;

  const { user } = useReferencedUser(target);

  const name = user?.name ?? 'Unknown';
  const avatar = user?.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id} className={defaultClasses.mention}>
      <Avatar size="small" id={target} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </NodeViewWrapper>
  );
};
