import { NodeRole, hasNodeRole } from '@colanode/core';
import { Info, Trash2, Users } from 'lucide-react';
import { LocalSpaceNode } from '@colanode/client/types';

import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';
import { SpaceDeleteForm } from '@/renderer/components/spaces/space-delete-form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { useLayout } from '@/renderer/contexts/layout';
import { SpaceGeneralTab } from '@/renderer/components/spaces/space-general-tab';

interface SpaceBodyProps {
  space: LocalSpaceNode;
  role: NodeRole;
}

export const SpaceBody = ({ space, role }: SpaceBodyProps) => {
  const layout = useLayout();
  const canEdit = hasNodeRole(role, 'admin');
  const canDelete = hasNodeRole(role, 'admin');

  return (
    <Tabs
      defaultValue="general"
      className="grid h-full max-h-full grid-cols-[200px_minmax(0,1fr)] overflow-hidden gap-4"
    >
      <TabsList className="flex h-full max-h-full flex-col items-start justify-start gap-1 rounded-none bg-white">
        <TabsTrigger
          key={`tab-trigger-general`}
          className="w-full justify-start p-2 hover:bg-gray-50"
          value="general"
        >
          <Info className="mr-2 size-4" />
          General
        </TabsTrigger>
        <TabsTrigger
          key={`tab-trigger-collaborators`}
          className="w-full justify-start p-2 hover:bg-gray-50"
          value="collaborators"
        >
          <Users className="mr-2 size-4" />
          Collaborators
        </TabsTrigger>
        {canDelete && (
          <TabsTrigger
            key={`tab-trigger-delete`}
            className="w-full justify-start p-2 hover:bg-gray-50"
            value="delete"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </TabsTrigger>
        )}
      </TabsList>
      <div className="overflow-auto pl-1 max-w-[50rem]">
        <TabsContent
          key="tab-content-info"
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
          value="general"
        >
          <SpaceGeneralTab space={space} readonly={!canEdit} />
        </TabsContent>
        <TabsContent
          key="tab-content-collaborators"
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
          value="collaborators"
        >
          <NodeCollaborators node={space} nodes={[space]} role={role} />
        </TabsContent>
        {canDelete && (
          <TabsContent
            key="tab-content-delete"
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            value="delete"
          >
            <SpaceDeleteForm
              id={space.id}
              onDeleted={() => {
                layout.close(space.id);
              }}
            />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
};
