import { LocalPageNode } from '@colanode/client/types';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface PageContainerTabProps {
  pageId: string;
}

export const PageContainerTab = ({ pageId }: PageContainerTabProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId: pageId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const page = data as LocalPageNode;
  if (!page) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    page.attributes.name && page.attributes.name.length > 0
      ? page.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={page.id}
        name={name}
        avatar={page.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
