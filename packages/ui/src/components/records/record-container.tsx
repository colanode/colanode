import { LocalRecordNode } from '@colanode/client/types';
import { RecordBody } from '@colanode/ui/components/records/record-body';
import { RecordNotFound } from '@colanode/ui/components/records/record-not-found';
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

  return <RecordBody record={record} role={role} />;
};
