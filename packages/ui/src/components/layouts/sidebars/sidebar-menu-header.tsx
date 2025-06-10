import { Bell, Check, Plus, Settings } from 'lucide-react';
import { Fragment, useState } from 'react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { UnreadBadge } from '@colanode/ui/components/ui/unread-badge';
import { useAccount } from '@colanode/ui/contexts/account';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const SidebarMenuHeader = () => {
  const workspace = useWorkspace();
  const account = useAccount();
  const radar = useRadar();

  const [open, setOpen] = useState(false);
  const workspaceListQuery = useQuery({
    type: 'workspace.list',
    accountId: account.id,
  });

  const workspaces = workspaceListQuery.data ?? [];
  const otherWorkspaces = workspaces.filter((w) => w.id !== workspace.id);
  const otherWorkspaceStates = otherWorkspaces.map((w) =>
    radar.getWorkspaceState(w.accountId, w.id)
  );
  const unreadCount = otherWorkspaceStates.reduce(
    (acc, curr) => acc + curr.state.unreadCount,
    0
  );
  const hasUnread = otherWorkspaceStates.some((w) => w.state.hasUnread);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center justify-center relative cursor-pointer outline-none">
          <Avatar
            id={workspace.id}
            avatar={workspace.avatar}
            name={workspace.name}
            className="size-10 rounded-lg shadow-md"
          />
          <UnreadBadge
            count={unreadCount}
            unread={hasUnread}
            className="absolute -top-1 right-0"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-80 rounded-lg"
        align="start"
        side="right"
        sideOffset={4}
      >
        <DropdownMenuItem key={workspace.id} className="p-0">
          <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar
              className="h-8 w-8 rounded-lg"
              id={workspace.id}
              name={workspace.name}
              avatar={workspace.avatar}
            />
            <p className="flex-1 text-left text-sm leading-tight truncate font-semibold">
              {workspace.name}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 p-2 cursor-pointer"
          onClick={() => {
            workspace.openSettings();
          }}
        >
          <Settings className="size-4" />
          <p className="font-medium">Settings</p>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 p-2" disabled={true}>
          <Bell className="size-4" />
          <p className="font-medium">Notifications</p>
        </DropdownMenuItem>
        {otherWorkspaces.length > 0 && (
          <Fragment>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="mb-1">Workspaces</DropdownMenuLabel>
            {workspaces.map((workspaceItem) => {
              const workspaceUnreadState = radar.getWorkspaceState(
                workspaceItem.accountId,
                workspaceItem.id
              );
              return (
                <DropdownMenuItem
                  key={workspaceItem.id}
                  className="p-0 cursor-pointer"
                  onClick={() => {
                    account.openWorkspace(workspaceItem.id);
                  }}
                >
                  <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar
                      className="h-8 w-8 rounded-lg"
                      id={workspaceItem.id}
                      name={workspaceItem.name}
                      avatar={workspaceItem.avatar}
                    />
                    <p className="flex-1 text-left text-sm leading-tight truncate font-normal">
                      {workspaceItem.name}
                    </p>
                    {workspaceItem.id === workspace.id ? (
                      <Check className="size-4" />
                    ) : (
                      <UnreadBadge
                        count={workspaceUnreadState.state.unreadCount}
                        unread={workspaceUnreadState.state.hasUnread}
                      />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </Fragment>
        )}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="gap-2 p-2 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => {
            account.openWorkspaceCreate();
          }}
        >
          <Plus className="size-4" />
          <p className="font-medium">Create workspace</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
