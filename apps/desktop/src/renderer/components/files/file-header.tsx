import { FileNode, Node, NodeRole } from '@colanode/core';

import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { FileSettings } from '@/renderer/components/files/file-settings';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';
import { Header } from '@/renderer/components/ui/header';
import { useContainer } from '@/renderer/contexts/container';

interface FileHeaderProps {
  nodes: Node[];
  file: FileNode;
  role: NodeRole;
}

export const FileHeader = ({ nodes, file, role }: FileHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <NodeBreadcrumb nodes={nodes} />}
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={file.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={file.id}
            nodes={nodes}
            role={role}
          />
          <FileSettings nodeId={file.id} />
        </div>
      </div>
    </Header>
  );
};
