import { LocalRecordNode } from '@colanode/client/types';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { ContainerSettings } from '@colanode/ui/components/workspaces/containers/container-settings';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { RecordBody } from '@colanode/ui/components/records/record-body';
import { RecordNotFound } from '@colanode/ui/components/records/record-not-found';
import { RecordSettings } from '@colanode/ui/components/records/record-settings';
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
    <>
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <ContainerSettings>
        <RecordSettings record={record} role={role} />
      </ContainerSettings>
      <RecordBody record={record} role={role} />
    </>
  );
};
