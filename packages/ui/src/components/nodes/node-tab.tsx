import { ChannelTab } from '@colanode/ui/components/channels/channel-tab';
import { ChatTab } from '@colanode/ui/components/chats/chat-tab';
import { DatabaseTab } from '@colanode/ui/components/databases/database-tab';
import { FileTab } from '@colanode/ui/components/files/file-tab';
import { FolderTab } from '@colanode/ui/components/folders/folder-tab';
import { MessageTab } from '@colanode/ui/components/messages/message-tab';
import { PageTab } from '@colanode/ui/components/pages/page-tab';
import { RecordTab } from '@colanode/ui/components/records/record-tab';
import { SpaceTab } from '@colanode/ui/components/spaces/space-tab';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface NodeTabProps {
  accountId: string;
  workspaceId: string;
  nodeId: string;
}

export const NodeTab = ({ accountId, workspaceId, nodeId }: NodeTabProps) => {
  const query = useLiveQuery({
    type: 'node.get',
    accountId,
    workspaceId,
    nodeId,
  });

  if (query.isPending) {
    return null;
  }

  const node = query.data;
  if (!node) {
    return null;
  }

  switch (node.type) {
    case 'space':
      return <SpaceTab space={node} />;
    case 'channel':
      return <ChannelTab channel={node} />;
    case 'chat':
      return <ChatTab chat={node} />;
    case 'page':
      return <PageTab page={node} />;
    case 'database':
      return <DatabaseTab database={node} />;
    case 'record':
      return <RecordTab record={node} />;
    case 'folder':
      return <FolderTab folder={node} />;
    case 'file':
      return <FileTab file={node} />;
    case 'message':
      return <MessageTab message={node} />;
    default:
      return null;
  }
};
