import { useNavigate } from '@tanstack/react-router';
import { type MouseEvent } from 'react';

import { LocalNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface TagNodesListProps {
  tagId: string;
}

const getName = (node: LocalNode | null | undefined): string => {
  if (
    node &&
    'name' in node &&
    typeof (node as { name?: unknown }).name === 'string'
  ) {
    const value = ((node as { name: string }).name ?? '').trim();
    if (value.length > 0) {
      return value;
    }
  }

  return 'Untitled';
};

const getAvatar = (node: LocalNode | null | undefined): string | undefined => {
  if (
    node &&
    'avatar' in node &&
    typeof (node as { avatar?: unknown }).avatar === 'string'
  ) {
    return (node as { avatar: string }).avatar;
  }

  return undefined;
};

export const TagNodesList = ({ tagId }: TagNodesListProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const layout = useLayout();

  const taggedNodesQuery = useLiveQuery({
    type: 'tag.nodes.list',
    userId: workspace.userId,
    tagId,
  });

  const items = taggedNodesQuery.data ?? [];

  const handleOpen = (event: MouseEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      layout.openInNewTab(`/workspace/${workspace.userId}/${targetId}`);
      return;
    }

    navigate({
      to: '/workspace/$userId/$nodeId',
      params: { userId: workspace.userId, nodeId: targetId },
    });
  };

  const handleAux = (event: MouseEvent, targetId: string) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    layout.openInNewTab(`/workspace/${workspace.userId}/${targetId}`);
  };

  if (taggedNodesQuery.isPending) {
    return (
      <p className="text-sm text-muted-foreground">Loading tagged nodes...</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No nodes are tagged with this label yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const name = getName(item.node);
        const avatar = getAvatar(item.node);
        const parentName = item.parent ? getName(item.parent) : null;

        return (
          <li key={item.node.id}>
            <button
              type="button"
              onClick={(event) => handleOpen(event, item.node.id)}
              onAuxClick={(event) => handleAux(event, item.node.id)}
              className="flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-border hover:bg-muted"
            >
              <Avatar
                size="small"
                id={item.node.id}
                name={name}
                avatar={avatar}
              />
              <span className="truncate text-sm text-foreground">{name}</span>
              {parentName && (
                <span className="truncate text-xs text-muted-foreground">
                  · {parentName}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
