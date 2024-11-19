import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { PageNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { PageSettings } from '@/renderer/components/pages/page-settings';
import { useContainer } from '@/renderer/contexts/container';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';

interface PageHeaderProps {
  nodes: Node[];
  page: PageNode;
  role: NodeRole;
}

export const PageHeader = ({ nodes, page, role }: PageHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <NodeBreadcrumb nodes={nodes} />
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={page.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={page.id}
            nodes={nodes}
            role={role}
          />
          <PageSettings page={page} role={role} />
        </div>
      </div>
    </Header>
  );
};
