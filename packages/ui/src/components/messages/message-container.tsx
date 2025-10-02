import { LocalMessageNode } from '@colanode/client/types';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { Message } from '@colanode/ui/components/messages/message';
import { MessageNotFound } from '@colanode/ui/components/messages/message-not-found';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { ConversationContext } from '@colanode/ui/contexts/conversation';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface MessageContainerProps {
  messageId: string;
}

export const MessageContainer = ({ messageId }: MessageContainerProps) => {
  const data = useNodeContainer<LocalMessageNode>(messageId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <MessageNotFound />;
  }

  return (
    <>
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <ConversationContext.Provider
        value={{
          id: data.node.id,
          role: data.role,
          rootId: data.node.rootId,
          canCreateMessage: true,
          onReply: () => {},
          onLastMessageIdChange: () => {},
          canDeleteMessage: () => false,
        }}
      >
        <Message message={data.node} />
      </ConversationContext.Provider>
    </>
  );
};
