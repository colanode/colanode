import { LocalChannelNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { Conversation } from '@colanode/ui/components/messages/conversation';
import { NodeTagBar } from '@colanode/ui/components/nodes/node-tag-bar';

interface ChannelContainerProps {
  channel: LocalChannelNode;
  role: NodeRole;
}

export const ChannelContainer = ({ channel, role }: ChannelContainerProps) => {
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <NodeTagBar node={channel} canEdit={canEdit} />
      <div className="min-h-0 flex-1">
        <Conversation
          conversationId={channel.id}
          rootId={channel.rootId}
          role={role}
        />
      </div>
    </div>
  );
};
