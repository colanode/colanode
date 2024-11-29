import React from 'react';
import { SpaceNode, compareString } from '@colanode/core';
import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { ChannelCreateDialog } from '@/renderer/components/channels/channel-create-dialog';
import { PageCreateDialog } from '@/renderer/components/pages/page-create-dialog';
import { DatabaseCreateDialog } from '@/renderer/components/databases/database-create-dialog';
import { NodeSidebarItem } from '@/renderer/components/layouts/node-sidebar-item';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/renderer/components/ui/sidebar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { FolderCreateDialog } from '@/renderer/components/folders/folder-create-dialog';
import { SpaceSettingsDialog } from '@/renderer/components/spaces/space-settings-dialog';
import {
  Ellipsis,
  MessageCircle,
  StickyNote,
  Database,
  Folder,
  Settings,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@/renderer/hooks/use-query';

interface SettingsState {
  open: boolean;
  tab?: string;
}

interface SpaceSidebarItemProps {
  node: SpaceNode;
}

export const SpaceSidebarItem = ({ node }: SpaceSidebarItemProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'node_children_get',
    nodeId: node.id,
    userId: workspace.userId,
    types: ['page', 'channel', 'database', 'folder'],
  });

  const children = (data ?? []).toSorted((a, b) => compareString(a.id, b.id));

  const [openCreatePage, setOpenCreatePage] = React.useState(false);
  const [openCreateChannel, setOpenCreateChannel] = React.useState(false);
  const [openCreateDatabase, setOpenCreateDatabase] = React.useState(false);
  const [openCreateFolder, setOpenCreateFolder] = React.useState(false);
  const [settingsState, setSettingsState] = React.useState<SettingsState>({
    open: false,
  });

  return (
    <React.Fragment>
      <Collapsible
        key={node.id}
        asChild
        defaultOpen={true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={node.attributes.name ?? ''}
              className="group/space-button"
            >
              <Avatar
                id={node.id}
                avatar={node.attributes.avatar}
                name={node.attributes.name}
                className="size-4 group-hover/space-button:hidden"
              />
              <ChevronRight className="hidden size-4 transition-transform duration-200 group-hover/space-button:block group-data-[state=open]/collapsible:rotate-90" />
              <span>{node.attributes.name}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                showOnHover
                className="size-4 focus-visible:outline-none focus-visible:ring-0"
              >
                <Ellipsis />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-1 w-72">
              <DropdownMenuLabel>
                {node.attributes.name ?? 'Unnamed'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setOpenCreatePage(true)}>
                <div className="flex flex-row items-center gap-2">
                  <StickyNote className="size-4" />
                  <span>Add page</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenCreateChannel(true)}>
                <div className="flex flex-row items-center gap-2">
                  <MessageCircle className="size-4" />
                  <span>Add channel</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenCreateDatabase(true)}>
                <div className="flex flex-row items-center gap-2">
                  <Database className="size-4" />
                  <span>Add database</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenCreateFolder(true)}>
                <div className="flex flex-row items-center gap-2">
                  <Folder className="size-4" />
                  <span>Add folder</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSettingsState({ open: true })}
              >
                <div className="flex flex-row items-center gap-2">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setSettingsState({
                    open: true,
                    tab: 'collaborators',
                  })
                }
              >
                <div className="flex flex-row items-center gap-2">
                  <Plus className="size-4" />
                  <span>Add collaborators</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 pr-0">
              {children.map((child) => (
                <SidebarMenuSubItem
                  key={child.id}
                  onClick={() => {
                    workspace.openInMain(child.id);
                  }}
                  className="cursor-pointer"
                >
                  <SidebarMenuSubButton
                    isActive={workspace.isNodeActive(child.id)}
                  >
                    <NodeSidebarItem node={child} />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      {openCreateChannel && (
        <ChannelCreateDialog
          spaceId={node.id}
          open={openCreateChannel}
          onOpenChange={setOpenCreateChannel}
        />
      )}
      {openCreatePage && (
        <PageCreateDialog
          spaceId={node.id}
          open={openCreatePage}
          onOpenChange={setOpenCreatePage}
        />
      )}
      {openCreateDatabase && (
        <DatabaseCreateDialog
          spaceId={node.id}
          open={openCreateDatabase}
          onOpenChange={setOpenCreateDatabase}
        />
      )}
      {openCreateFolder && (
        <FolderCreateDialog
          spaceId={node.id}
          open={openCreateFolder}
          onOpenChange={setOpenCreateFolder}
        />
      )}
      {settingsState.open && (
        <SpaceSettingsDialog
          space={node}
          open={settingsState.open}
          onOpenChange={(open) =>
            setSettingsState({ open, tab: settingsState.tab })
          }
          defaultTab={settingsState.tab}
        />
      )}
    </React.Fragment>
  );
};
