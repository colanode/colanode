import { eq, useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { JSONContent } from '@tiptap/core';
import { type MouseEvent } from 'react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

interface MentionRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const MentionRenderer = ({ node }: MentionRendererProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate();

  const target = node.attrs?.target;
  const targetType = node.attrs?.targetType as string | undefined;
  const isGroup = targetType === 'group' || target === 'everyone';

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
        .where(({ nodes }) => eq(nodes.id, target ?? ''))
        .findOne(),
    [workspace.userId, target, targetType]
  );

  if (isGroup) {
    return (
      <span
        className={defaultClasses.mention}
        style={{ backgroundColor: 'rgba(250, 204, 21, 0.25)' }}
      >
        <span role="presentation">@everyone</span>
      </span>
    );
  }

  const user = targetType === 'user' || !targetType ? userQuery.data : null;
  const resource = targetType && targetType !== 'user' ? nodeQuery.data : null;
  const name = user?.name ?? ((resource as { name?: string } | null)?.name ?? 'Unknown');
  const avatar = user?.avatar;

  const canNavigate = !!resource && !!target;

  const handleClick = (event: MouseEvent) => {
    if (!canNavigate || !target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    navigate({
      to: '/workspace/$userId/$nodeId',
      params: { userId: workspace.userId, nodeId: target },
    });
  };

  return (
    <span
      className={defaultClasses.mention}
      onClick={handleClick}
      style={canNavigate ? { cursor: 'pointer' } : undefined}
    >
      <Avatar size="small" id={target ?? '?'} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </span>
  );
};
