import { Check, ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

interface NodeCollaboratorRole {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
}

const roles: NodeCollaboratorRole[] = [
  {
    name: 'Admin',
    value: 'admin',
    description: 'Administration access',
    enabled: true,
  },
  {
    name: 'Editor',
    value: 'editor',
    description: 'Editing access',
    enabled: true,
  },
  {
    name: 'Collaborator',
    value: 'collaborator',
    description: 'Can contribute in content',
    enabled: true,
  },
  {
    name: 'Viewer',
    value: 'viewer',
    description: 'Can view content',
    enabled: true,
  },
];

interface NodeCollaboratorRoleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  canEdit: boolean;
}

export const NodeCollaboratorRoleDropdown = ({
  value,
  onChange,
  canEdit,
}: NodeCollaboratorRoleDropdownProps) => {
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
          <ChevronDown className="ml-2 size-4 text-muted-foreground" />
        </p>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onSelect={() => {
              onChange(role.value);
            }}
          >
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex w-full flex-col">
                <p className="mb-1 text-sm font-medium leading-none">
                  {role.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
              {value === role.value && <Check className="mr-2 size-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
