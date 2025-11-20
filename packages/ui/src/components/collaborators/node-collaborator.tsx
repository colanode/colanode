import { eq, useLiveQuery } from '@tanstack/react-db';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { NodeRole } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { NodeCollaboratorRoleDropdown } from '@colanode/ui/components/collaborators/node-collaborator-role-dropdown';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

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

  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: collections.workspace(workspace.userId).users })
        .where(({ users }) => eq(users.id, collaboratorId))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          email: users.email,
        }))
        .findOne(),
    [collaboratorId]
  );

  const user = userQuery.data;
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3">
        <Avatar id={user.id} name={user.name} avatar={user.avatar} />
        <div className="grow">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1">
        <NodeCollaboratorRoleDropdown
          value={role}
          canEdit={canEdit}
          onChange={(newRole) => {
            mutate({
              input: {
                type: 'node.collaborator.update',
                nodeId: nodeId,
                collaboratorId: collaboratorId,
                role: newRole,
                userId: workspace.userId,
              },
              onError(error) {
                toast.error(error.message);
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
                  type: 'node.collaborator.delete',
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
