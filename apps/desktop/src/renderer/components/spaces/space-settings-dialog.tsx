import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/renderer/components/ui/dialog';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { SpaceUpdateForm } from '@/renderer/components/spaces/space-update-form';
import { SpaceDeleteForm } from '@/renderer/components/spaces/space-delete-form';
import { Info, Trash2, Users } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';

interface SpaceSettingsDialogProps {
  id: string;
  name: string;
  avatar?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export const SpaceSettingsDialog = ({
  id,
  name,
  avatar,
  open,
  onOpenChange,
  defaultTab,
}: SpaceSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-h-3/4 md:max-h-3/4 p-3 md:h-3/4 md:w-3/4 md:max-w-full">
        <VisuallyHidden>
          <DialogTitle>Space Settings</DialogTitle>
        </VisuallyHidden>
        <Tabs
          defaultValue={defaultTab ?? 'info'}
          className="grid h-full max-h-full grid-cols-[240px_minmax(0,1fr)] overflow-hidden"
        >
          <TabsList className="flex h-full max-h-full flex-col items-start justify-start gap-1 rounded-none border-r border-r-gray-100 bg-white pr-3">
            <div className="mb-1 flex h-10 w-full items-center justify-between bg-gray-50 p-1 text-foreground/80">
              <div className="flex items-center gap-2">
                <Avatar id={id} avatar={avatar} size="small" name={name} />
                <span>{name ?? 'Error'}</span>
              </div>
            </div>
            <TabsTrigger
              key={`tab-trigger-info`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="info"
            >
              <Info className="mr-2 size-4" />
              Info
            </TabsTrigger>
            <TabsTrigger
              key={`tab-trigger-collaborators`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="collaborators"
            >
              <Users className="mr-2 size-4" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger
              key={`tab-trigger-delete`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="delete"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </TabsTrigger>
          </TabsList>
          <div className="overflow-auto p-4">
            <TabsContent
              key="tab-content-info"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="info"
            >
              <SpaceUpdateForm id={id} />
            </TabsContent>
            <TabsContent
              key="tab-content-collaborators"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="collaborators"
            >
              <NodeCollaborators nodeId={id} />
            </TabsContent>
            <TabsContent
              key="tab-content-delete"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="delete"
            >
              <SpaceDeleteForm
                id={id}
                onDeleted={() => {
                  onOpenChange(false);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};