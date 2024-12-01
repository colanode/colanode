import { Node, NodeRole,RecordNode } from '@colanode/core';

import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';
import { RecordSettings } from '@/renderer/components/records/record-settings';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface RecordHeaderProps {
  nodes: Node[];
  record: RecordNode;
  role: NodeRole;
}

export const RecordHeader = ({ nodes, record, role }: RecordHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <NodeBreadcrumb nodes={nodes} />}
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={record.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={record.id}
            nodes={nodes}
            role={role}
          />
          <RecordSettings record={record} role={role} />
        </div>
      </div>
    </Header>
  );
};
