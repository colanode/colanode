import { RecordEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface RecordContainerTabProps {
  recordId: string;
}

export const RecordContainerTab = ({ recordId }: RecordContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: recordId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const record = entry as RecordEntry;
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
