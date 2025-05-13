import { LocalDatabaseNode } from '@colanode/client/types';

import { DatabaseNotFound } from '@/renderer/components/databases/database-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { DatabaseSettings } from '@/renderer/components/databases/database-settings';
import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';

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
