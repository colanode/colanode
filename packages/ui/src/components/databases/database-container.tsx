import { LocalDatabaseNode } from '@colanode/client/types';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseNotFound } from '@colanode/ui/components/databases/database-not-found';
import { DatabaseSettings } from '@colanode/ui/components/databases/database-settings';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { ContainerSettings } from '@colanode/ui/components/workspaces/containers/container-settings';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface DatabaseContainerProps {
  databaseId: string;
}

export const DatabaseContainer = ({ databaseId }: DatabaseContainerProps) => {
  const data = useNodeContainer<LocalDatabaseNode>(databaseId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <DatabaseNotFound />;
  }

  const { node: database, role } = data;

  return (
    <>
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <ContainerSettings>
        <DatabaseSettings database={database} role={role} />
      </ContainerSettings>
      <Database database={database} role={role}>
        <DatabaseViews />
      </Database>
    </>
  );
};
