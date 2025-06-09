import { JSONContent } from '@tiptap/core';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface MentionRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const MentionRenderer = ({ node }: MentionRendererProps) => {
  const workspace = useWorkspace();

  const target = node.attrs?.target;
  const userGetQuery = useQuery({
    type: 'user.get',
    userId: target,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const name = userGetQuery.data?.name ?? 'Unknown';
  return (
    <span className={defaultClasses.mention}>
      <Avatar
        size="small"
        id={target ?? '?'}
        name={name}
        avatar={userGetQuery.data?.avatar}
      />
      <span role="presentation">{name}</span>
    </span>
  );
};
