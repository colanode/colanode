import { match } from 'ts-pattern';
import { getIdType, IdType } from '@colanode/core';
import { ContainerTab } from '@colanode/client/types';
import { TabsContent } from '@colanode/ui/components/ui/tabs';
import { SpaceContainer } from '@colanode/ui/components/spaces/space-container';
import { ChannelContainer } from '@colanode/ui/components/channels/channel-container';
import { ChatContainer } from '@colanode/ui/components/chats/chat-container';
import { DatabaseContainer } from '@colanode/ui/components/databases/database-container';
import { FileContainer } from '@colanode/ui/components/files/file-container';
import { FolderContainer } from '@colanode/ui/components/folders/folder-container';
import { PageContainer } from '@colanode/ui/components/pages/page-container';
import { RecordContainer } from '@colanode/ui/components/records/record-container';
import { MessageContainer } from '@colanode/ui/components/messages/message-container';

interface ContainerTabContentProps {
  tab: ContainerTab;
}

export const ContainerTabContent = ({ tab }: ContainerTabContentProps) => {
  return (
    <TabsContent
      value={tab.path}
      key={tab.path}
      className="h-full min-h-full w-full min-w-full m-0 pt-2"
    >
      {match(getIdType(tab.path))
        .with(IdType.Space, () => <SpaceContainer spaceId={tab.path} />)
        .with(IdType.Channel, () => <ChannelContainer channelId={tab.path} />)
        .with(IdType.Page, () => <PageContainer pageId={tab.path} />)
        .with(IdType.Database, () => (
          <DatabaseContainer databaseId={tab.path} />
        ))
        .with(IdType.Record, () => <RecordContainer recordId={tab.path} />)
        .with(IdType.Chat, () => <ChatContainer chatId={tab.path} />)
        .with(IdType.Folder, () => <FolderContainer folderId={tab.path} />)
        .with(IdType.File, () => <FileContainer fileId={tab.path} />)
        .with(IdType.Message, () => <MessageContainer messageId={tab.path} />)
        .otherwise(() => null)}
    </TabsContent>
  );
};
