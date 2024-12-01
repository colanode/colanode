import { DatabaseNode, Node, NodeRole } from '@colanode/core';

import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { DatabaseSettings } from '@/renderer/components/databases/database-settings';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface DatabaseHeaderProps {
  nodes: Node[];
  database: DatabaseNode;
  role: NodeRole;
}

export const DatabaseHeader = ({
  nodes,
  database,
  role,
}: DatabaseHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <NodeBreadcrumb nodes={nodes} />}
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={database.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={database.id}
            nodes={nodes}
            role={role}
          />
          <DatabaseSettings database={database} role={role} />
        </div>
      </div>
    </Header>
  );
};
