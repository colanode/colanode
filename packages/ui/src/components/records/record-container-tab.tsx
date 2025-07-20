import { LocalRecordNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface RecordContainerTabProps {
  recordId: string;
}

export const RecordContainerTab = ({ recordId }: RecordContainerTabProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: recordId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const record = nodeGetQuery.data as LocalRecordNode;
  if (!record) {
    return <p>Not found</p>;
  }

  const name =
    record.attributes.name && record.attributes.name.length > 0
      ? record.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={record.id}
        name={name}
        avatar={record.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
