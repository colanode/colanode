import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { FolderNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { FolderSettings } from '@/renderer/components/folders/folder-settings';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';
import { useContainer } from '@/renderer/contexts/container';

interface FolderHeaderProps {
  nodes: Node[];
  folder: FolderNode;
  role: NodeRole;
}

export const FolderHeader = ({ nodes, folder, role }: FolderHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <NodeBreadcrumb nodes={nodes} />
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={folder.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={folder.id}
            nodes={nodes}
            role={role}
          />
          <FolderSettings folder={folder} role={role} />
        </div>
      </div>
    </Header>
  );
};
