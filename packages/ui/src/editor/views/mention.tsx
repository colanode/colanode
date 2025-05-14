import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { defaultClasses } from '@colanode/ui/editor/classes';

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const target = node.attrs.target;
  const { data } = useQuery({
    type: 'user_get',
    userId: target,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const name = data?.name ?? 'Unknown';

  return (
    <NodeViewWrapper data-id={node.attrs.id} className={defaultClasses.mention}>
      <Avatar size="small" id={target} name={name} avatar={data?.avatar} />
      <span role="presentation">{name}</span>
    </NodeViewWrapper>
  );
};
