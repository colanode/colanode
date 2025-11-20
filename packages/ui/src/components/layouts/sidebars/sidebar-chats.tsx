import { useLiveQuery } from '@tanstack/react-db';

import { collections } from '@colanode/ui/collections';
import { ChatCreatePopover } from '@colanode/ui/components/chats/chat-create-popover';
import { ChatSidebarItem } from '@colanode/ui/components/chats/chat-sidebar-item';
import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const SidebarChats = () => {
  const workspace = useWorkspace();

  const chatListQuery = useLiveQuery((q) =>
    q
      .from({ chats: collections.workspace(workspace.userId).chats })
      .orderBy(({ chats }) => chats.id, 'asc')
  );

  const chats = chatListQuery.data;

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
