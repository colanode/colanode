import { NodeRole } from '@colanode/core';
import { LocalDatabaseNode } from '@colanode/client/types';

import { Database } from '@/renderer/components/databases/database';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

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
