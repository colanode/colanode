import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { ChannelNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { NodeBreadcrumb } from '@/renderer/components/layouts/node-breadcrumb';
import { ChannelSettings } from '@/renderer/components/channels/channel-settings';
import { useContainer } from '@/renderer/contexts/container';
import { NodeFullscreenButton } from '@/renderer/components/layouts/node-fullscreen-button';

interface ChannelHeaderProps {
  nodes: Node[];
  channel: ChannelNode;
  role: NodeRole;
}

export const ChannelHeader = ({ nodes, channel, role }: ChannelHeaderProps) => {
  const container = useContainer();

  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <div className="flex-grow">
          {container.mode === 'main' && <NodeBreadcrumb nodes={nodes} />}
          {container.mode === 'modal' && (
            <NodeFullscreenButton nodeId={channel.id} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover
            nodeId={channel.id}
            nodes={nodes}
            role={role}
          />
          <ChannelSettings channel={channel} role={role} />
        </div>
      </div>
    </Header>
  );
};
