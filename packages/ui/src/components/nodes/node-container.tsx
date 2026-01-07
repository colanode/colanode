import { Outlet } from '@tanstack/react-router';

import { ChannelContainer } from '@colanode/ui/components/channels/channel-container';
import { ChatContainer } from '@colanode/ui/components/chats/chat-container';
import { DatabaseContainer } from '@colanode/ui/components/databases/database-container';
import { FileContainer } from '@colanode/ui/components/files/file-container';
import { FolderContainer } from '@colanode/ui/components/folders/folder-container';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { MessageContainer } from '@colanode/ui/components/messages/message-container';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { NodeSettings } from '@colanode/ui/components/nodes/node-settings';
import { PageContainer } from '@colanode/ui/components/pages/page-container';
import { RecordContainer } from '@colanode/ui/components/records/record-container';
import { SpaceContainer } from '@colanode/ui/components/spaces/space-container';
import { ContainerType } from '@colanode/ui/contexts/container';
import { useNode } from '@colanode/ui/contexts/node';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface NodeContainerProps {
  type: ContainerType;
  nodeId: string;
  onFullscreen?: () => void;
}
interface NodeContentProps {
  type: ContainerType;
  onFullscreen?: () => void;
}

const NodeContent = ({ type, onFullscreen }: NodeContentProps) => {
  const data = useNode();
  useNodeRadar(data.node);

  return (
    <Container
      type={type}
      breadcrumb={<NodeBreadcrumb nodes={data.breadcrumb} />}
      actions={<NodeSettings node={data.node} role={data.role} />}
      onFullscreen={onFullscreen}
    >
      {data.node.type === 'space' && (
        <SpaceContainer space={data.node} role={data.role} />
      )}
      {data.node.type === 'channel' && (
        <ChannelContainer channel={data.node} role={data.role} />
      )}
      {data.node.type === 'page' && (
        <PageContainer page={data.node} role={data.role} />
      )}
      {data.node.type === 'database' && (
        <DatabaseContainer database={data.node} role={data.role} />
      )}
      {data.node.type === 'record' && (
        <RecordContainer record={data.node} role={data.role} />
      )}
      {data.node.type === 'chat' && (
        <ChatContainer node={data.node} role={data.role} />
      )}
      {data.node.type === 'folder' && (
        <FolderContainer folder={data.node} role={data.role} />
      )}
      {data.node.type === 'message' && (
        <MessageContainer message={data.node} role={data.role} />
      )}
      {data.node.type === 'file' && <FileContainer file={data.node} />}
    </Container>
  );
};

export const NodeContainer = ({
  type,
  nodeId,
  onFullscreen,
}: NodeContainerProps) => {
  return (
    <>
      <NodeProvider nodeId={nodeId}>
        <NodeContent type={type} onFullscreen={onFullscreen} />
      </NodeProvider>
      <Outlet />
    </>
  );
};
