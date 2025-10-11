import { useParams } from '@tanstack/react-router';
import { match } from 'ts-pattern';

import { getIdType, IdType } from '@colanode/core';
import { ChannelContainer } from '@colanode/ui/components/channels/channel-container';
import { ChatContainer } from '@colanode/ui/components/chats/chat-container';
import { DatabaseContainer } from '@colanode/ui/components/databases/database-container';
import { FileContainer } from '@colanode/ui/components/files/file-container';
import { FolderContainer } from '@colanode/ui/components/folders/folder-container';
import { MessageContainer } from '@colanode/ui/components/messages/message-container';
import { PageContainer } from '@colanode/ui/components/pages/page-container';
import { RecordContainer } from '@colanode/ui/components/records/record-container';
import { SpaceContainer } from '@colanode/ui/components/spaces/space-container';

export const NodeScreen = () => {
  const { nodeId } = useParams({
    from: '/workspace/$userId/$nodeId',
  });

  return match(getIdType(nodeId))
    .with(IdType.Space, () => <SpaceContainer spaceId={nodeId} />)
    .with(IdType.Channel, () => <ChannelContainer channelId={nodeId} />)
    .with(IdType.Page, () => <PageContainer pageId={nodeId} />)
    .with(IdType.Database, () => <DatabaseContainer databaseId={nodeId} />)
    .with(IdType.Record, () => <RecordContainer recordId={nodeId} />)
    .with(IdType.Chat, () => <ChatContainer chatId={nodeId} />)
    .with(IdType.Folder, () => <FolderContainer folderId={nodeId} />)
    .with(IdType.File, () => <FileContainer fileId={nodeId} />)
    .with(IdType.Message, () => <MessageContainer messageId={nodeId} />)
    .otherwise(() => null);
};
