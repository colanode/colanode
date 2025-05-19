import { LocalDatabaseNode } from '@colanode/client/types';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseNotFound } from '@colanode/ui/components/databases/database-not-found';
import { DatabaseSettings } from '@colanode/ui/components/databases/database-settings';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
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
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <DatabaseSettings database={database} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <Database database={database} role={role}>
          <DatabaseViews />
        </Database>
      </ContainerBody>
    </Container>
  );
};
