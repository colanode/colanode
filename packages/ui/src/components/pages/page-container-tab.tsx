import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface PageContainerTabProps {
  pageId: string;
}

export const PageContainerTab = ({ pageId }: PageContainerTabProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: pageId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const page = nodeGetQuery.data as LocalPageNode;
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
