import { LocalRecordNode } from '@colanode/client/types';

import { RecordNotFound } from '@/renderer/components/records/record-not-found';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { RecordBody } from '@/renderer/components/records/record-body';
import { RecordSettings } from '@/renderer/components/records/record-settings';

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
