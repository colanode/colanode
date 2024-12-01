import { ChannelNode, NodeRole } from '@colanode/core';

import { Conversation } from '@/renderer/components/messages/conversation';

interface ChannelBodyProps {
  channel: ChannelNode;
  role: NodeRole;
}

export const ChannelBody = ({ channel, role }: ChannelBodyProps) => {
  return <Conversation conversationId={channel.id} role={role} />;
};
