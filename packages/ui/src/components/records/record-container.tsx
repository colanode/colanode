import { LocalRecordNode } from '@colanode/client/types';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { RecordBody } from '@colanode/ui/components/records/record-body';
import { RecordNotFound } from '@colanode/ui/components/records/record-not-found';
import { RecordSettings } from '@colanode/ui/components/records/record-settings';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface RecordContainerProps {
  recordId: string;
}

export const RecordContainer = ({ recordId }: RecordContainerProps) => {
  const data = useNodeContainer<LocalRecordNode>(recordId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <RecordNotFound />;
  }

  const { node: record, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <RecordSettings record={record} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <RecordBody record={record} role={role} />
      </ContainerBody>
    </Container>
  );
};
