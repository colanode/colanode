import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const target = node.attrs.target;
  const userGetQuery = useQuery({
    type: 'user.get',
    userId: target,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const user = userGetQuery.data;
  const name = user?.name ?? 'Unknown';
  const avatar = user?.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id} className={defaultClasses.mention}>
      <Avatar size="small" id={target} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </NodeViewWrapper>
  );
};
