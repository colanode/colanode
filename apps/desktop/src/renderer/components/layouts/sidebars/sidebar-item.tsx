import React from 'react';
import { LocalNode } from '@colanode/client/types';

import { ChannelSidebarItem } from '@/renderer/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { DatabaseSidebarItem } from '@/renderer/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@/renderer/components/folders/folder-sidebar-item';
import { PageSidebarItem } from '@/renderer/components/pages/page-sidebar-item';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';

interface SidebarItemProps {
  node: LocalNode;
}

export const SidebarItem = ({ node }: SidebarItemProps): React.ReactNode => {
  switch (node.type) {
    case 'space':
      return <SpaceSidebarItem space={node} />;
    case 'channel':
      return <ChannelSidebarItem channel={node} />;
    case 'chat':
      return <ChatSidebarItem chat={node} />;
    case 'page':
      return <PageSidebarItem page={node} />;
    case 'database':
      return <DatabaseSidebarItem database={node} />;
    case 'folder':
      return <FolderSidebarItem folder={node} />;
    default:
      return null;
  }
};
