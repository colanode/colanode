import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Info, Trash2, Users } from 'lucide-react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@colanode/ui/components/ui/tabs';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceUpdate } from '@colanode/ui/components/workspaces/workspace-update';
import { WorkspaceUsers } from '@colanode/ui/components/workspaces/workspace-users';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceSettingsDialog = ({
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps) => {
  const workspace = useWorkspace();

  if (!workspace) {
    return null;
  }

  const canDelete = workspace.role === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="md:min-h-3/4 md:max-h-3/4 p-3 md:h-3/4 md:w-3/4 md:max-w-full"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Workspace Settings</DialogTitle>
        </VisuallyHidden>
        <Tabs
          defaultValue="info"
          className="grid h-full max-h-full grid-cols-[240px_minmax(0,1fr)] overflow-hidden"
        >
          <TabsList className="flex w-full max-h-full flex-col items-start justify-start gap-1 rounded-none border-r border-r-gray-100 bg-white pr-3">
            <div className="mb-1 flex h-10 w-full items-center justify-between bg-gray-50 p-1 text-foreground/80">
              <div className="flex items-center gap-2">
                <Avatar
                  id={workspace.id}
                  name={workspace.name}
                  avatar={workspace.avatar}
                  size="small"
                />
                <span className="truncate font-semibold">{workspace.name}</span>
              </div>
            </div>
            <TabsTrigger
              key="tab-trigger-info"
              className="w-full justify-start p-2 hover:bg-gray-50 cursor-pointer"
              value="info"
            >
              <Info className="mr-2 size-4" />
              Info
            </TabsTrigger>
            <TabsTrigger
              key="tab-trigger-users"
              className="w-full justify-start p-2 hover:bg-gray-50 cursor-pointer"
              value="users"
            >
              <Users className="mr-2 size-4" />
              Users
            </TabsTrigger>
            {canDelete && (
              <TabsTrigger
                key="tab-trigger-delete"
                className="w-full justify-start p-2 hover:bg-gray-50 cursor-pointer"
                value="delete"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </TabsTrigger>
            )}
          </TabsList>
          <div className="overflow-auto p-4">
            <TabsContent
              key="tab-content-info"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="info"
            >
              <WorkspaceUpdate />
            </TabsContent>
            <TabsContent
              key="tab-content-users"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="users"
            >
              <WorkspaceUsers />
            </TabsContent>
            {canDelete && (
              <TabsContent
                key="tab-content-delete"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                value="delete"
              >
                <WorkspaceDelete onDeleted={() => onOpenChange(false)} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
