import { inArray, useLiveQuery } from '@tanstack/react-db';
import { ChevronDown, Trash2, X } from 'lucide-react';

import {
  DatabaseViewFieldFilterAttributes,
  CollaboratorFieldAttributes,
} from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { Badge } from '@colanode/ui/components/ui/badge';
import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { UserSearch } from '@colanode/ui/components/users/user-search';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';
import {
  collaboratorFieldFilterOperators,
  createdByFieldFilterOperators,
} from '@colanode/ui/lib/databases';

interface ViewCollaboratorFieldFilterProps {
  field: CollaboratorFieldAttributes;
  filter: DatabaseViewFieldFilterAttributes;
}

interface CollaboratorBadgeProps {
  id: string;
  name: string;
  avatar: string | null;
}

const CollaboratorBadge = ({ id, name, avatar }: CollaboratorBadgeProps) => {
  return (
    <div className="flex flex-row items-center gap-1 text-sm">
      <Avatar id={id} name={name} avatar={avatar} size="small" />
      <p>{name}</p>
    </div>
  );
};

const isOperatorWithoutValue = (operator: string) => {
  return (
    operator === 'is_me' ||
    operator === 'is_not_me' ||
    operator === 'is_empty' ||
    operator === 'is_not_empty'
  );
};

export const ViewCollaboratorFieldFilter = ({
  field,
  filter,
}: ViewCollaboratorFieldFilterProps) => {
  const workspace = useWorkspace();
  const view = useDatabaseView();

  const operator =
    collaboratorFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? collaboratorFieldFilterOperators[0]!;

  const collaboratorIds = (filter.value as string[]) ?? [];
  const collaboratorsQuery = useLiveQuery((q) =>
    q
      .from({ users: database.workspace(workspace.userId).users })
      .where(({ users }) => inArray(users.id, collaboratorIds))
      .select(({ users }) => ({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        email: users.email,
      }))
  );

  const collaborators = collaboratorsQuery.data;
  const hideInput = isOperatorWithoutValue(operator.value);

  return (
    <Popover
      open={view.isFieldFilterOpened(filter.id)}
      onOpenChange={() => {
        if (view.isFieldFilterOpened(filter.id)) {
          view.closeFieldFilter(filter.id);
        } else {
          view.openFieldFilter(filter.id);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          {field.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-96 flex-col gap-2 p-2">
        <div className="flex flex-row items-center gap-3 text-sm">
          <div className="flex flex-row items-center gap-0.5 p-1">
            <FieldIcon type={field.type} className="size-4" />
            <p>{field.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold cursor-pointer hover:bg-accent">
                <p>{operator.label}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {createdByFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value = isOperatorWithoutValue(operator.value)
                      ? []
                      : collaboratorIds;

                    view.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
                      value: value,
                    });
                  }}
                >
                  {operator.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              view.removeFilter(filter.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        {!hideInput && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2">
                {collaborators.slice(0, 1).map((collaborator) => (
                  <CollaboratorBadge
                    key={collaborator.id}
                    id={collaborator.id}
                    name={collaborator.name}
                    avatar={collaborator.avatar}
                  />
                ))}
                {collaborators.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No collaborators selected
                  </p>
                )}
                {collaborators.length > 1 && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs px-1 text-muted-foreground"
                  >
                    +{collaborators.length - 1}
                  </Badge>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
              {collaborators.length > 0 && (
                <div className="flex flex-col flex-wrap gap-2 p-2">
                  {collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex w-full flex-row items-center gap-2"
                    >
                      <Avatar
                        id={collaborator.id}
                        name={collaborator.name}
                        avatar={collaborator.avatar}
                        className="h-7 w-7"
                      />
                      <div className="flex flex-grow flex-col">
                        <p className="text-sm">{collaborator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {collaborator.email}
                        </p>
                      </div>
                      <X
                        className="size-4 cursor-pointer"
                        onClick={() => {
                          const newCollaborators = collaboratorIds.filter(
                            (id) => id !== collaborator.id
                          );

                          view.updateFilter(filter.id, {
                            ...filter,
                            value: newCollaborators,
                          });
                        }}
                      />
                    </div>
                  ))}
                  <Separator className="w-full my-2" />
                </div>
              )}
              <UserSearch
                exclude={collaboratorIds}
                onSelect={(user) => {
                  const newCollaborators = collaboratorIds.includes(user.id)
                    ? collaboratorIds.filter((id) => id !== user.id)
                    : [...collaboratorIds, user.id];

                  view.updateFilter(filter.id, {
                    ...filter,
                    value: newCollaborators,
                  });
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  );
};
