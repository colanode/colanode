import { Trash2 } from 'lucide-react';

import { NodeRole } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { NodeCollaboratorRoleDropdown } from '@colanode/ui/components/collaborators/node-collaborator-role-dropdown';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { toast } from '@colanode/ui/hooks/use-toast';

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
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId: collaboratorId,
  });

  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <Avatar id={data.id} name={data.name} avatar={data.avatar} />
        <div className="flex-grow">
          <p className="text-sm font-medium leading-none">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.email}</p>
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
                accountId: workspace.accountId,
                workspaceId: workspace.id,
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
                  accountId: workspace.accountId,
                  workspaceId: workspace.id,
                },
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
