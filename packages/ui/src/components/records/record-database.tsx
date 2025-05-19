import { LocalDatabaseNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Database } from '@colanode/ui/components/databases/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface RecordDatabaseProps {
  id: string;
  role: NodeRole;
  children: React.ReactNode;
}

export const RecordDatabase = ({ id, role, children }: RecordDatabaseProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'node_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    nodeId: id,
  });

  if (isPending) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <Database database={data as LocalDatabaseNode} role={role}>
      {children}
    </Database>
  );
};
