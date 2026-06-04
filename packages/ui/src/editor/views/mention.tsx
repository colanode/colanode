import { eq, useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { type MouseEvent } from 'react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

export const MentionNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate();

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

  const user = userQuery.data;
  const resource = nodeQuery.data;

  // 旧的 mention 可能没有持久化 targetType，这里用实际命中的集合兜底判断
  const isUser = targetType === 'user' || (!targetType && !!user && !resource);

  const resourceName =
    resource && 'name' in resource && typeof resource.name === 'string'
      ? resource.name
      : null;
  const resourceAvatar =
    resource && 'avatar' in resource && typeof resource.avatar === 'string'
      ? resource.avatar
      : null;

  const name = isUser
    ? (user?.name ?? 'Unknown')
    : (resourceName ?? user?.name ?? 'Unknown');

  const avatar = isUser
    ? (user?.avatar ?? undefined)
    : (resourceAvatar ?? user?.avatar ?? undefined);

  const canNavigate = !isUser && !!resource;

  const handleClick = (event: MouseEvent) => {
    if (!canNavigate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    navigate({
      to: '/workspace/$userId/$nodeId',
      params: {
        userId: workspace.userId,
        nodeId: target,
      },
    });
  };

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      className={defaultClasses.mention}
      onClick={handleClick}
      style={canNavigate ? { cursor: 'pointer' } : undefined}
    >
      <Avatar size="small" id={target} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </NodeViewWrapper>
  );
};
