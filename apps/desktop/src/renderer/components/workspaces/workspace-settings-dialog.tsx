import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Info, Trash2, Users } from 'lucide-react';
import React from 'react';
import { match } from 'ts-pattern';

import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/renderer/components/ui/sidebar';
import { WorkspaceUpdate } from '@/renderer/components/workspaces/workspace-update';
import { WorkspaceUsers } from '@/renderer/components/workspaces/workspace-users';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { WorkspaceDelete } from '@/renderer/components/workspaces/workspace-delete';

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceSettingsDialog = ({
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps) => {
  const workspace = useWorkspace();
  const [tab, setTab] = React.useState<'info' | 'users' | 'delete'>('info');

  if (!workspace) {
    return null;
  }

  const canDelete = workspace.role === 'owner';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="md:min-h-3/4 md:max-h-3/4 overflow-hidden p-0 md:h-3/4 md:w-3/4 md:max-w-full"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Workspace Settings</DialogTitle>
        </VisuallyHidden>
        <SidebarProvider>
          <Sidebar collapsible="none">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <div className="flex flex-row items-center gap-2">
                      <Avatar
                        id={workspace.id}
                        avatar={workspace.avatar}
                        name={workspace.name}
                        className="size-6"
                      />
                      <span className="truncate font-semibold">
                        {workspace.name}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={tab === 'info'}
                        onClick={() => setTab('info')}
                      >
                        <Info className="mr-2 size-4" />
                        <span>Info</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={tab === 'users'}
                        onClick={() => setTab('users')}
                      >
                        <Users className="mr-2 size-4" />
                        <span>Users</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {canDelete && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={tab === 'delete'}
                          onClick={() => setTab('delete')}
                          disabled={workspace.role !== 'owner'}
                        >
                          <Trash2 className="mr-2 size-4" />
                          <span>Delete</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 overflow-auto p-7">
            {match(tab)
              .with('info', () => <WorkspaceUpdate />)
              .with('users', () => <WorkspaceUsers />)
              .with('delete', () => (
                <WorkspaceDelete onDeleted={() => onOpenChange(false)} />
              ))
              .exhaustive()}
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
};
