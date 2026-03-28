import type { DocumentState, DocumentUpdate, LocalRecordNode } from '@colanode/client/types';
import { hasNodeRole } from '@colanode/core';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { RecordDetailLayout } from '@colanode/ui/components/records/record-detail-layout';
import { useNode } from '@colanode/ui/contexts/node';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

import { DocumentEditor } from './document-editor';

interface MobileRecordRuntimeProps {
  recordId: string;
  state: DocumentState | null;
  updates: DocumentUpdate[];
}

export const MobileRecordRuntime = ({
  recordId,
  state,
  updates,
}: MobileRecordRuntimeProps) => {
  return (
    <NodeProvider nodeId={recordId}>
      <MobileRecordRuntimeContent state={state} updates={updates} />
    </NodeProvider>
  );
};

const MobileRecordRuntimeContent = ({
  state,
  updates,
}: {
  state: DocumentState | null;
  updates: DocumentUpdate[];
}) => {
  const workspace = useWorkspace();
  const { node, role } = useNode<LocalRecordNode>();

  if (!node || node.type !== 'record') {
    return null;
  }

  const canEdit =
    node.createdBy === workspace.userId || hasNodeRole(role, 'editor');

  return (
    <RecordDetailLayout record={node} role={role}>
      <DocumentEditor
        node={node}
        state={state}
        updates={updates}
        canEdit={canEdit}
      />
    </RecordDetailLayout>
  );
};
