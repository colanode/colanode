import { match } from 'ts-pattern';

import { ContainerTab, SpecialContainerTabPath } from '@colanode/client/types';
import { getIdType, IdType } from '@colanode/core';
import { AccountLogout } from '@colanode/ui/components/accounts/account-logout';
import { AccountSettings } from '@colanode/ui/components/accounts/account-settings';
import { ChannelContainer } from '@colanode/ui/components/channels/channel-container';
import { ChatContainer } from '@colanode/ui/components/chats/chat-container';
import { DatabaseContainer } from '@colanode/ui/components/databases/database-container';
import { FileContainer } from '@colanode/ui/components/files/file-container';
import { FolderContainer } from '@colanode/ui/components/folders/folder-container';
import { MessageContainer } from '@colanode/ui/components/messages/message-container';
import { PageContainer } from '@colanode/ui/components/pages/page-container';
import { RecordContainer } from '@colanode/ui/components/records/record-container';
import { SpaceContainer } from '@colanode/ui/components/spaces/space-container';
import { TabsContent } from '@colanode/ui/components/ui/tabs';
import { WorkspaceDownloads } from '@colanode/ui/components/workspaces/downloads/workspace-downloads';
import { WorkspaceStorage } from '@colanode/ui/components/workspaces/storage/workspace-storage';
import { WorkspaceUploads } from '@colanode/ui/components/workspaces/uploads/workspace-uploads';
import { WorkspaceSettings } from '@colanode/ui/components/workspaces/workspace-settings';
import { WorkspaceUsers } from '@colanode/ui/components/workspaces/workspace-users';

interface ContainerTabContentProps {
  tab: ContainerTab;
}

const getContainerTabContentBody = (tab: ContainerTab) => {
  if (tab.path === SpecialContainerTabPath.WorkspaceSettings) {
    return <WorkspaceSettings />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceUsers) {
    return <WorkspaceUsers />;
  }

  if (tab.path === SpecialContainerTabPath.AccountSettings) {
    return <AccountSettings />;
  }

  if (tab.path === SpecialContainerTabPath.AccountLogout) {
    return <AccountLogout />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceStorage) {
    return <WorkspaceStorage />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceUploads) {
    return <WorkspaceUploads />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceDownloads) {
    return <WorkspaceDownloads />;
  }

  return match(getIdType(tab.path))
    .with(IdType.Space, () => <SpaceContainer spaceId={tab.path} />)
    .with(IdType.Channel, () => <ChannelContainer channelId={tab.path} />)
    .with(IdType.Page, () => <PageContainer pageId={tab.path} />)
    .with(IdType.Database, () => <DatabaseContainer databaseId={tab.path} />)
    .with(IdType.Record, () => <RecordContainer recordId={tab.path} />)
    .with(IdType.Chat, () => <ChatContainer chatId={tab.path} />)
    .with(IdType.Folder, () => <FolderContainer folderId={tab.path} />)
    .with(IdType.File, () => <FileContainer fileId={tab.path} />)
    .with(IdType.Message, () => <MessageContainer messageId={tab.path} />)
    .otherwise(() => null);
};

export const ContainerTabContent = ({ tab }: ContainerTabContentProps) => {
  const content = getContainerTabContentBody(tab);
  if (content === null) {
    return null;
  }

  return (
    <TabsContent
      value={tab.path}
      key={tab.path}
      className="h-full min-h-full w-full min-w-full m-0 pt-2"
    >
      {content}
    </TabsContent>
  );
};
