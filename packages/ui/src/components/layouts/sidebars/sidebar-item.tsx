import { LocalNode } from '@colanode/client/types';
import { ChannelSidebarItem } from '@colanode/ui/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@colanode/ui/components/chats/chat-sidebar-item';
import { DatabaseSidebarItem } from '@colanode/ui/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@colanode/ui/components/folders/folder-sidebar-item';
import { PageSidebarItem } from '@colanode/ui/components/pages/page-sidebar-item';
import { SpaceSidebarItem } from '@colanode/ui/components/spaces/space-sidebar-item';

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
