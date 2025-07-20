import { LocalSpaceNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface SpaceContainerTabProps {
  spaceId: string;
}

export const SpaceContainerTab = ({ spaceId }: SpaceContainerTabProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: spaceId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const space = nodeGetQuery.data as LocalSpaceNode;
  if (!space) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    space.attributes.name && space.attributes.name.length > 0
      ? space.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={space.id}
        name={name}
        avatar={space.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
