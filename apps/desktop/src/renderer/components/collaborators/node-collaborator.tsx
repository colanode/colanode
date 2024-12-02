import { NodeRole } from '@colanode/core';
import { Trash2 } from 'lucide-react';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { NodeCollaboratorRoleDropdown } from '@/renderer/components/collaborators/node-collaborator-role-dropdown';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useQuery } from '@/renderer/hooks/use-query';
import { toast } from '@/renderer/hooks/use-toast';

interface NodeCollaboratorProps {
  nodeId: string;
  collaboratorId: string;
  role: NodeRole;
  canEdit: boolean;
  canRemove: boolean;
}

export const NodeCollaborator = ({
  nodeId,
  collaboratorId,
  role,
  canEdit,
  canRemove,
}: NodeCollaboratorProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const { data } = useQuery({
    type: 'node_get',
    nodeId: collaboratorId,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'user') {
    return null;
  }

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <Avatar
          id={data.id}
          name={data.attributes.name}
          avatar={data.attributes.avatar}
        />
        <div className="flex-grow">
          <p className="text-sm font-medium leading-none">
            {data.attributes.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.attributes.email}
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <NodeCollaboratorRoleDropdown
          value={role}
          canEdit={canEdit}
          onChange={(newRole) => {
            mutate({
              input: {
                type: 'node_collaborator_update',
                nodeId: nodeId,
                collaboratorId: collaboratorId,
                role: newRole,
                userId: workspace.userId,
              },
              onError(error) {
                toast({
                  title: 'Failed to update collaborator',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
        {canRemove && (
          <Trash2
            className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              mutate({
                input: {
                  type: 'node_collaborator_delete',
                  nodeId: nodeId,
                  collaboratorId: collaboratorId,
                  userId: workspace.userId,
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
