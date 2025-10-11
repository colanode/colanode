import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalChatNode } from '@colanode/client/types';
import { ChatCreatePopover } from '@colanode/ui/components/chats/chat-create-popover';
import { ChatSidebarItem } from '@colanode/ui/components/chats/chat-sidebar-item';
import { Link } from '@colanode/ui/components/ui/link';
import { SidebarHeader } from '@colanode/ui/components/workspaces/sidebars/sidebar-header';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

export const SidebarChats = () => {
  const workspace = useWorkspace();

  const chatsQuery = useLiveQuery((q) =>
    q
      .from({ nodes: database.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.type, 'chat'))
  );

  const chats = chatsQuery.data as LocalChatNode[];

  return (
    <div className="flex flex-col group/sidebar h-full px-2">
      <SidebarHeader title="Chats" actions={<ChatCreatePopover />} />
      <div className="flex w-full min-w-0 flex-col gap-1">
        {chats.map((item) => (
          <Link
            key={item.id}
            from="/workspace/$userId"
            to="$nodeId"
            params={{ nodeId: item.id }}
            className="px-2 flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm h-7 cursor-pointer text-foreground hover:bg-muted"
            activeProps={{
              className: 'bg-muted font-medium',
            }}
          >
            {({ isActive }) => (
              <ChatSidebarItem chat={item} isActive={isActive} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};
