import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Fragment, useCallback, useState } from 'react';

import { FieldDeleteDialog } from '@colanode/ui/components/databases/fields/field-delete-dialog';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface MutationInput {
  id: string;
  display: boolean;
}

export const ViewFieldSettings = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  const handleDisplayChange = useCallback(
    (input: MutationInput) => {
      workspace.collections.nodes.update(view.id, (draft) => {
        if (draft.type !== 'database_view') {
          return;
        }

        const draftField = draft.fields?.[input.id];
        if (draftField && draftField.display === input.display) {
          return;
        }

        if (draftField) {
          draftField.display = input.display;
          return;
        }

        draft.fields = {
          ...draft.fields,
          [input.id]: {
            id: input.id,
            display: input.display,
          },
        };
      });
    },
    [view.id]
  );

  return (
    <Fragment>
      <div className="flex flex-col gap-2 text-sm">
        <p className="my-1 font-semibold">Fields</p>
        {database.fields.map((field) => {
          const isDisplayed =
            view.fields.find((f) => f.field.id === field.id)?.display ?? false;

          return (
            <div
              key={field.id}
              className={cn(
                'flex flex-row items-center justify-between gap-2 p-0.5',
                'cursor-pointer rounded-md hover:bg-accent'
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <FieldIcon type={field.type} className="size-4" />
                <div>{field.name}</div>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Tooltip>
                  <TooltipTrigger>
                    <span
                      className={cn(
                        database.canEdit && !database.isLocked
                          ? 'cursor-pointer'
                          : 'opacity-50'
                      )}
                      onClick={() => {
                        if (!database.canEdit || database.isLocked) return;

                        handleDisplayChange({
                          id: field.id,
                          display: !isDisplayed,
                        });
                      }}
                    >
                      {isDisplayed ? (
                        <Eye className="size-4" />
                      ) : (
                        <EyeOff className="size-4" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-row items-center gap-2">
                    {isDisplayed
                      ? 'Hide field from this view'
                      : 'Show field in this view'}
                  </TooltipContent>
                </Tooltip>
                {database.canEdit && !database.isLocked && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Trash2
                        className={cn(
                          'size-4',
                          database.canEdit && !database.isLocked
                            ? 'cursor-pointer'
                            : 'opacity-50'
                        )}
                        onClick={() => {
                          setDeleteFieldId(field.id);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="flex flex-row items-center gap-2">
                      Delete field from database
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {deleteFieldId && (
        <FieldDeleteDialog
          id={deleteFieldId}
          open={!!deleteFieldId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteFieldId(null);
            }
          }}
        />
      )}
    </Fragment>
  );
};
