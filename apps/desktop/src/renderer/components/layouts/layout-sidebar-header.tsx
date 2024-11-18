import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useAccount } from '@/renderer/contexts/account';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/renderer/components/ui/sidebar';
import { ChevronsUpDown, Settings, Plus, Bell, Check } from 'lucide-react';
import { useRadar } from '@/renderer/contexts/radar';
import { ReadStateIndicator } from '@/renderer/components/layouts/read-state-indicator';
import { useQuery } from '@/renderer/hooks/use-query';

export const LayoutSidebarHeader = () => {
  const workspace = useWorkspace();
  const account = useAccount();
  const navigate = useNavigate();
  const radar = useRadar();

  const [open, setOpen] = React.useState(false);
  const { data } = useQuery({
    type: 'workspace_list',
    accountId: account.id,
  });

  const workspaces = data ?? [];
  const otherWorkspaces = workspaces.filter((w) => w.id !== workspace.id);
  const otherWorkspaceStates = otherWorkspaces.map((w) =>
    radar.getWorkspaceState(w.userId)
  );
  const importantCount = otherWorkspaceStates.reduce(
    (acc, curr) => acc + curr.importantCount,
    0
  );
  const hasUnseenChanges = otherWorkspaceStates.some((w) => w.hasUnseenChanges);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar
                  id={workspace.id}
                  avatar={workspace.avatar}
                  name={workspace.name}
                  className="h-full w-full"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{workspace.name}</span>
                <span className="truncate text-xs">Free Plan</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
              <ReadStateIndicator
                count={importantCount}
                hasChanges={hasUnseenChanges}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
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
              className="gap-2 p-2"
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
              <React.Fragment>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="mb-1">
                  Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspaceItem) => {
                  const workspaceState = radar.getWorkspaceState(
                    workspaceItem.userId
                  );
                  return (
                    <DropdownMenuItem
                      key={workspaceItem.id}
                      className="p-0"
                      onClick={() => {
                        navigate(`/${account.id}/${workspaceItem.id}`);
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
                          <ReadStateIndicator
                            count={workspaceState.importantCount}
                            hasChanges={workspaceState.hasUnseenChanges}
                          />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="gap-2 p-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigate(`/${account.id}/create`);
              }}
            >
              <Plus className="size-4" />
              <p className="font-medium">Create workspace</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
