import { X } from 'lucide-react';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { match } from 'ts-pattern';

import { ContainerTab, SpecialContainerTabPath } from '@colanode/client/types';
import { getIdType, IdType } from '@colanode/core';
import { AccountLogoutTab } from '@colanode/ui/components/accounts/account-logout-tab';
import { AccountSettingsTab } from '@colanode/ui/components/accounts/account-settings-tab';
import { AppAppearanceSettingsTab } from '@colanode/ui/components/app/app-appearance-settings-tab';
import { ChannelContainerTab } from '@colanode/ui/components/channels/channel-container-tab';
import { ChatContainerTab } from '@colanode/ui/components/chats/chat-container-tab';
import { DatabaseContainerTab } from '@colanode/ui/components/databases/database-container-tab';
import { FileContainerTab } from '@colanode/ui/components/files/file-container-tab';
import { FolderContainerTab } from '@colanode/ui/components/folders/folder-container-tab';
import { MessageContainerTab } from '@colanode/ui/components/messages/message-container-tab';
import { PageContainerTab } from '@colanode/ui/components/pages/page-container-tab';
import { RecordContainerTab } from '@colanode/ui/components/records/record-container-tab';
import { SpaceContainerTab } from '@colanode/ui/components/spaces/space-container-tab';
import { TabsTrigger } from '@colanode/ui/components/ui/tabs';
import { WorkspaceDownloadsTab } from '@colanode/ui/components/workspaces/downloads/workspace-downloads-tab';
import { WorkspaceStorageTab } from '@colanode/ui/components/workspaces/storage/workspace-storage-tab';
import { WorkspaceUploadsTab } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-tab';
import { WorkspaceSettingsTab } from '@colanode/ui/components/workspaces/workspace-settings-tab';
import { WorkspaceUsersTab } from '@colanode/ui/components/workspaces/workspace-users-tab';
import { cn } from '@colanode/ui/lib/utils';

interface ContainerTabTriggerProps {
  tab: ContainerTab;
  onClose: () => void;
  onOpen: () => void;
  onMove: (before: string | null) => void;
}

const getContainerTabTriggerContent = (tab: ContainerTab) => {
  if (tab.path === SpecialContainerTabPath.WorkspaceSettings) {
    return <WorkspaceSettingsTab />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceUsers) {
    return <WorkspaceUsersTab />;
  }

  if (tab.path === SpecialContainerTabPath.AccountSettings) {
    return <AccountSettingsTab />;
  }

  if (tab.path === SpecialContainerTabPath.AccountLogout) {
    return <AccountLogoutTab />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceStorage) {
    return <WorkspaceStorageTab />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceUploads) {
    return <WorkspaceUploadsTab />;
  }

  if (tab.path === SpecialContainerTabPath.WorkspaceDownloads) {
    return <WorkspaceDownloadsTab />;
  }

  if (tab.path === SpecialContainerTabPath.AppAppearance) {
    return <AppAppearanceSettingsTab />;
  }

  return match(getIdType(tab.path))
    .with(IdType.Space, () => <SpaceContainerTab spaceId={tab.path} />)
    .with(IdType.Channel, () => (
      <ChannelContainerTab
        channelId={tab.path}
        isActive={tab.active ?? false}
      />
    ))
    .with(IdType.Page, () => <PageContainerTab pageId={tab.path} />)
    .with(IdType.Database, () => <DatabaseContainerTab databaseId={tab.path} />)
    .with(IdType.Record, () => <RecordContainerTab recordId={tab.path} />)
    .with(IdType.Chat, () => (
      <ChatContainerTab chatId={tab.path} isActive={tab.active ?? false} />
    ))
    .with(IdType.Folder, () => <FolderContainerTab folderId={tab.path} />)
    .with(IdType.File, () => <FileContainerTab fileId={tab.path} />)
    .with(IdType.Message, () => <MessageContainerTab messageId={tab.path} />)
    .otherwise(() => null);
};

export const ContainerTabTrigger = ({
  tab,
  onClose,
  onOpen,
  onMove,
}: ContainerTabTriggerProps) => {
  const [, dragRef] = useDrag<string>({
    type: 'container-tab',
    item: tab.path,
    canDrag: () => true,
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ before: string | null }>();
      if (!dropResult) {
        return;
      }

      onMove(dropResult.before);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'container-tab',
    drop: () => ({
      before: tab.path,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragDropRef = dragRef(dropRef(buttonRef));

  const tabContent = getContainerTabTriggerContent(tab);
  if (tabContent === null) {
    return null;
  }

  return (
    <TabsTrigger
      value={tab.path}
      key={tab.path}
      className={cn(
        'overflow-hidden rounded-b-none bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none h-10 group/tab app-no-drag-region flex items-center justify-between gap-2 max-w-60',
        tab.preview && 'italic',
        dropMonitor.isOver &&
          dropMonitor.canDrop &&
          'border-l-2 border-blue-300'
      )}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
      onDoubleClick={() => {
        if (tab.preview) {
          onOpen();
        }
      }}
      ref={dragDropRef as React.RefAttributes<HTMLButtonElement>['ref']}
    >
      <div className="overflow-hidden truncate">{tabContent}</div>
      <div
        className="opacity-0 group-hover/tab:opacity-100 group-data-[state=active]/tab:opacity-100 transition-opacity duration-200 flex-shrink-0 cursor-pointer"
        onClick={() => onClose()}
      >
        <X className="size-4 text-muted-foreground hover:text-foreground" />
      </div>
    </TabsTrigger>
  );
};
