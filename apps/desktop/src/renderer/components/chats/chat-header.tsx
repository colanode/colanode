import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { ChatNode, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { useContainer } from '@/renderer/contexts/container';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';

interface ChatHeaderProps {
  chat: ChatNode;
  role: NodeRole;
}

export const ChatHeader = ({ chat, role }: ChatHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          <NodeBreadcrumb nodes={[chat]} />
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={chat.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={chat.id}
            nodes={[chat]}
            role={role}
          />
        </div>
      </div>
    </Header>
  );
};