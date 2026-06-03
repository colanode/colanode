import { eq, useLiveQuery } from '@tanstack/react-db';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();

  const target = node.attrs.target;
  const targetType = node.attrs.targetType as string | undefined;

  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: workspace.collections.users })
        .where(({ users }) => eq(users.id, target))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        }))
        .findOne(),
    [workspace.userId, target, targetType]
  );

  const nodeQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, target))
        .findOne(),
    [workspace.userId, target, targetType]
  );

  const user = targetType === 'user' || !targetType ? userQuery.data : null;
  const resource = targetType && targetType !== 'user' ? nodeQuery.data : null;
  const name = user?.name ?? ((resource as { name?: string } | null)?.name ?? 'Unknown');
  const avatar = user?.avatar;

  return (
    <NodeViewWrapper data-id={node.attrs.id} className={defaultClasses.mention}>
      <Avatar size="small" id={target} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </NodeViewWrapper>
  );
};
