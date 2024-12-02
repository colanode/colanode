import { WorkspaceRole } from '@colanode/core';
import { Check, ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface WorkspaceRoleItem {
  name: string;
  value: WorkspaceRole;
  description: string;
  enabled: boolean;
}

const roles: WorkspaceRoleItem[] = [
  {
    name: 'Owner',
    value: 'owner',
    description: 'Full access',
    enabled: true,
  },
  {
    name: 'Admin',
    value: 'admin',
    description: 'Administration access',
    enabled: true,
  },
  {
    name: 'Collaborator',
    value: 'collaborator',
    description: 'Can contribute in content',
    enabled: true,
  },
  {
    name: 'Guest',
    value: 'guest',
    description: 'Can view content',
    enabled: true,
  },
  {
    name: 'No access',
    value: 'none',
    description: 'No access to workspace',
    enabled: true,
  },
];

interface WorkspaceUserRoleDropdownProps {
  userId: string;
  value: WorkspaceRole;
  canEdit: boolean;
}

export const WorkspaceUserRoleDropdown = ({
  userId,
  value,
  canEdit,
}: WorkspaceUserRoleDropdownProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const currentRole = roles.find((role) => role.value === value);

  if (!canEdit) {
    return (
      <p className="p-1 text-sm text-muted-foreground">{currentRole?.name}</p>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="flex cursor-pointer flex-row items-center p-1 text-sm text-muted-foreground hover:bg-gray-50">
          {currentRole?.name}
          {isPending ? (
            <Spinner className="ml-2 size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="ml-2 size-4 text-muted-foreground" />
          )}
        </p>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {roles
          .filter((role) => role.enabled)
          .map((role) => (
            <DropdownMenuItem
              key={role.value}
              onSelect={() => {
                if (isPending) {
                  return;
                }

                if (role.value === value) {
                  return;
                }

                mutate({
                  input: {
                    type: 'workspace_user_role_update',
                    userToUpdateId: userId,
                    role: role.value,
                    userId: workspace.userId,
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to update role',
                      description: error.message,
                      variant: 'destructive',
                    });
                  },
                });
              }}
            >
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex flex-1 w-full flex-col">
                  <p className="mb-1 text-sm font-medium leading-none">
                    {role.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
                {value === role.value && <Check className="size-4" />}
              </div>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
