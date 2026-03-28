import { LocalRecordNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Document } from '@colanode/ui/components/documents/document';
import { RecordDetailLayout } from '@colanode/ui/components/records/record-detail-layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface RecordContainerProps {
  record: LocalRecordNode;
  role: NodeRole;
}

export const RecordContainer = ({ record, role }: RecordContainerProps) => {
  const workspace = useWorkspace();

  const canEdit =
    record.createdBy === workspace.userId || hasNodeRole(role, 'editor');
  return (
    <RecordDetailLayout record={record} role={role}>
      <Document node={record} canEdit={canEdit} autoFocus={false} />
    </RecordDetailLayout>
  );
};
