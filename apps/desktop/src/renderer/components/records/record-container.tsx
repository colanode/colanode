import { extractNodeRole } from '@colanode/core';

import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordHeader } from '@/renderer/components/records/record-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface RecordContainerProps {
  nodeId: string;
}

export const RecordContainer = ({ nodeId }: RecordContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_tree_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const record = nodes.find((node) => node.id === nodeId);
  if (!record || record.type !== 'record') {
    return null;
  }

  const databaseIndex = nodes.findIndex(
    (node) => node.id === record.attributes.databaseId
  );
  if (databaseIndex === -1) {
    return null;
  }

  const database = nodes[databaseIndex];
  if (!database || database.type !== 'database') {
    return null;
  }

  const databaseAncestors = nodes.slice(0, databaseIndex);

  const recordRole = extractNodeRole(nodes, workspace.userId);
  const databaseRole = extractNodeRole(
    [...databaseAncestors, database],
    workspace.userId
  );

  if (!recordRole || !databaseRole) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader nodes={nodes} record={record} role={recordRole} />
      <RecordBody
        record={record}
        recordRole={recordRole}
        database={database}
        databaseRole={databaseRole}
      />
    </div>
  );
};
