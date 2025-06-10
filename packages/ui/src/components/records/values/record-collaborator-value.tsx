import { X } from 'lucide-react';
import { Fragment, useState } from 'react';

import { User } from '@colanode/client/types';
import { CollaboratorFieldAttributes } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Badge } from '@colanode/ui/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { UserSearch } from '@colanode/ui/components/users/user-search';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQueries } from '@colanode/ui/hooks/use-queries';

interface RecordCollaboratorValueProps {
  field: CollaboratorFieldAttributes;
  readOnly?: boolean;
}

const CollaboratorBadge = ({ collaborator }: { collaborator: User }) => {
  return (
    <div className="flex flex-row items-center gap-1 text-sm">
      <Avatar
        id={collaborator.id}
        name={collaborator.name}
        avatar={collaborator.avatar}
        size="small"
      />
      <p>{collaborator.name}</p>
    </div>
  );
};

export const RecordCollaboratorValue = ({
  field,
  readOnly,
}: RecordCollaboratorValueProps) => {
  const workspace = useWorkspace();
  const record = useRecord();

  const [open, setOpen] = useState(false);

  const collaboratorIds = record.getCollaboratorValue(field) ?? [];
  const results = useQueries(
    collaboratorIds.map((id) => ({
      type: 'user.get',
      userId: id,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    }))
  );

  const collaborators: User[] = [];
  for (const result of results) {
    if (result.data) {
      collaborators.push(result.data);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0 overflow-hidden">
          {collaborators.slice(0, 1).map((collaborator) => (
            <CollaboratorBadge
              key={collaborator.id}
              collaborator={collaborator}
            />
          ))}
          {collaborators.length === 0 && ' '}
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
        <div className="flex flex-col flex-wrap gap-2 p-2">
          {collaborators.length > 0 ? (
            <Fragment>
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
                  {record.canEdit && !readOnly && (
                    <X
                      className="size-4 cursor-pointer"
                      onClick={() => {
                        if (!record.canEdit || readOnly) return;

                        const newCollaborators = collaboratorIds.filter(
                          (id) => id !== collaborator.id
                        );

                        if (newCollaborators.length === 0) {
                          record.removeFieldValue(field);
                        } else {
                          record.updateFieldValue(field, {
                            type: 'string_array',
                            value: newCollaborators,
                          });
                        }
                      }}
                    />
                  )}
                </div>
              ))}
              <Separator className="w-full my-2" />
            </Fragment>
          ) : (
            <p className="text-sm text-muted-foreground">No collaborators</p>
          )}
        </div>
        {record.canEdit && !readOnly && (
          <UserSearch
            exclude={collaboratorIds}
            onSelect={(user) => {
              if (!record.canEdit || readOnly) return;

              const newCollaborators = collaboratorIds.includes(user.id)
                ? collaboratorIds.filter((id) => id !== user.id)
                : [...collaboratorIds, user.id];

              if (newCollaborators.length === 0) {
                record.removeFieldValue(field);
              } else {
                record.updateFieldValue(field, {
                  type: 'string_array',
                  value: newCollaborators,
                });
              }

              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
