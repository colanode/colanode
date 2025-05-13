import React from 'react';
import { NodeRole } from '@colanode/core';
import { User } from '@colanode/client/types';

import { NodeCollaboratorRoleDropdown } from '@/renderer/components/collaborators/node-collaborator-role-dropdown';
import { NodeCollaboratorSearch } from '@/renderer/components/collaborators/node-collaborator-search';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface NodeCollaboratorCreateProps {
  nodeId: string;
  existingCollaborators: string[];
}

export const NodeCollaboratorCreate = ({
  nodeId,
  existingCollaborators,
}: NodeCollaboratorCreateProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [users, setUsers] = React.useState<User[]>([]);
  const [role, setRole] = React.useState<NodeRole>('editor');

  return (
    <div className="flex flex-col gap-2">
      <NodeCollaboratorSearch
        value={users}
        onChange={setUsers}
        excluded={existingCollaborators}
      />
      <div className="flex justify-end space-x-2">
        <NodeCollaboratorRoleDropdown
          value={role}
          onChange={setRole}
          canEdit={true}
        />
        <Button
          variant="default"
          className="shrink-0"
          size="sm"
          disabled={users.length === 0 || isPending}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'node_collaborator_create',
                nodeId,
                collaboratorIds: users.map((user) => user.id),
                role: role,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                setUsers([]);
              },
              onError(error) {
                toast({
                  title: 'Failed to add collaborators',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {isPending && <Spinner className="mr-1" />}
          Invite
        </Button>
      </div>
    </div>
  );
};
