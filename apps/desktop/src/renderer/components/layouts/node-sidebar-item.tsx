import { Node } from '@colanode/core';
import React from 'react';

import { ChannelSidebarItem } from '@/renderer/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { DatabaseSidebarItem } from '@/renderer/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@/renderer/components/folders/folder-sidebar-item';
import { PageSidebarItem } from '@/renderer/components/pages/page-sidebar-item';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';

interface NodeSidebarItemProps {
  node: Node;
}

export const NodeSidebarItem = ({
  node,
}: NodeSidebarItemProps): React.ReactNode => {
  switch (node.type) {
    case 'space':
      return <SpaceSidebarItem node={node} />;
    case 'channel':
      return <ChannelSidebarItem node={node} />;
    case 'chat':
      return <ChatSidebarItem node={node} />;
    case 'page':
      return <PageSidebarItem node={node} />;
    case 'database':
      return <DatabaseSidebarItem node={node} />;
    case 'folder':
      return <FolderSidebarItem node={node} />;
    default:
      return null;
  }
};
