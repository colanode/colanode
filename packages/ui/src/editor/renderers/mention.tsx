import { eq, useLiveQuery } from '@tanstack/react-db';
import { JSONContent } from '@tiptap/core';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import { defaultClasses } from '@colanode/ui/editor/classes';

interface MentionRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const MentionRenderer = ({ node }: MentionRendererProps) => {
  const workspace = useWorkspace();

  const target = node.attrs?.target;
  const userQuery = useLiveQuery((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
      .where(({ users }) => eq(users.id, target))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      }))
      .findOne()
  );

  const user = userQuery.data;
  const name = user?.name ?? 'Unknown';
  const avatar = user?.avatar;

  return (
    <span className={defaultClasses.mention}>
      <Avatar size="small" id={target ?? '?'} name={name} avatar={avatar} />
      <span role="presentation">{name}</span>
    </span>
  );
};
