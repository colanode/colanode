import { LocalChatNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { NodeCollaboratorsPopover } from '@colanode/ui/components/collaborators/node-collaborators-popover';

interface ChatSettingsProps {
  chat: LocalChatNode;
  role: NodeRole;
}
export const ChatSettings = ({ chat, role }: ChatSettingsProps) => {
  return <NodeCollaboratorsPopover node={chat} nodes={[chat]} role={role} />;
};
