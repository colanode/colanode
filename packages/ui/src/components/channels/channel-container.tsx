import { LocalChannelNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { Conversation } from '@colanode/ui/components/messages/conversation';

interface ChannelContainerProps {
  channel: LocalChannelNode;
  role: NodeRole;
}

export const ChannelContainer = ({ channel, role }: ChannelContainerProps) => {
  return (
    <Conversation
      conversationId={channel.id}
      rootId={channel.rootId}
      role={role}
    />
  );
};
