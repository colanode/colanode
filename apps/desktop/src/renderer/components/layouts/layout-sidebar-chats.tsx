import { ChatNode } from '@colanode/core';

import { ChatCreatePopover } from '@/renderer/components/chats/chat-create-popover';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/renderer/components/ui/sidebar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const LayoutSidebarChats = () => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'node_children_get',
    userId: workspace.userId,
    nodeId: workspace.id,
    types: ['chat'],
  });

  const chats = data?.map((node) => node as ChatNode) ?? [];

  return (
    <SidebarGroup className="group/sidebar-chats group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupAction className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-chats:opacity-100">
        <ChatCreatePopover />
      </SidebarGroupAction>
      <SidebarMenu>
        {chats.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={workspace.isNodeActive(item.id)}
              onClick={() => {
                workspace.openInMain(item.id);
              }}
            >
              <ChatSidebarItem node={item} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
