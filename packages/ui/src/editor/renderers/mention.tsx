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
  const { data } = useQuery({
    type: 'user_get',
    userId: target,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const name = data?.name ?? 'Unknown';
  return (
    <span className={defaultClasses.mention}>
      <Avatar
        size="small"
        id={target ?? '?'}
        name={name}
        avatar={data?.avatar}
      />
      <span role="presentation">{name}</span>
    </span>
  );
};
