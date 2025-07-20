import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Database } from '@colanode/ui/components/databases/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface RecordDatabaseProps {
  id: string;
  role: NodeRole;
  children: React.ReactNode;
}

export const RecordDatabase = ({ id, role, children }: RecordDatabaseProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    nodeId: id,
  });

  if (nodeGetQuery.isPending) {
    return null;
  }

  if (!nodeGetQuery.data) {
    return null;
  }

  const database = nodeGetQuery.data as LocalDatabaseNode;
  return (
    <Database database={database} role={role}>
      {children}
    </Database>
  );
};
