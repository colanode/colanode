import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface DatabaseContainerTabProps {
  databaseId: string;
}

export const DatabaseContainerTab = ({
  databaseId,
}: DatabaseContainerTabProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useQuery({
    type: 'node.get',
    nodeId: databaseId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const database = nodeGetQuery.data as LocalDatabaseNode;
  if (!database) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    database.attributes.name && database.attributes.name.length > 0
      ? database.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={database.id}
        name={name}
        avatar={database.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
