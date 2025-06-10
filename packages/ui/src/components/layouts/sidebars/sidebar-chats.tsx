import { ChatCreatePopover } from '@colanode/ui/components/chats/chat-create-popover';
import { ChatSidebarItem } from '@colanode/ui/components/chats/chat-sidebar-item';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

export const SidebarChats = () => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const chatListQuery = useQuery({
    type: 'chat.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 0,
    count: 100,
  });

  const chats = chatListQuery.data ?? [];

  return (
    <div className="flex flex-col group/sidebar-chats h-full px-2">
      <div className="flex items-center justify-between h-12 pl-2 pr-1 app-drag-region">
        <p className="font-bold text-muted-foreground flex-grow app-no-drag-region">
          Chats
        </p>
        <div className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-chats:opacity-100 flex items-center justify-center app-no-drag-region">
          <ChatCreatePopover />
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        {chats.map((item) => (
          <button
            key={item.id}
            className={cn(
              'px-2 flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-7 cursor-pointer',
              layout.activeTab === item.id &&
                'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            )}
            onClick={() => {
              layout.preview(item.id);
            }}
            onDoubleClick={() => {
              layout.open(item.id);
            }}
          >
            <ChatSidebarItem chat={item} />
          </button>
        ))}
      </div>
    </div>
  );
};
