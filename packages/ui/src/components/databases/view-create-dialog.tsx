import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Calendar, Columns, Table } from 'lucide-react';
import { FC } from 'react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { LocalDatabaseViewNode } from '@colanode/client/types';
import {
  compareString,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string(),
  type: z.enum(['table', 'board', 'calendar']),
});

type ViewCreateFormValues = z.infer<typeof formSchema>;

const defaultValues: ViewCreateFormValues = {
  name: '',
  type: 'table',
};

interface ViewTypeOption {
  name: string;
  icon: FC;
  type: 'table' | 'board' | 'calendar';
}

const viewTypes: ViewTypeOption[] = [
  {
    name: 'Table',
    icon: Table,
    type: 'table',
  },
  {
    name: 'Board',
    icon: Columns,
    type: 'board',
  },
  {
    name: 'Calendar',
    icon: Calendar,
    type: 'calendar',
  },
];

interface ViewCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCreateDialog = ({
  open,
  onOpenChange,
}: ViewCreateDialogProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ViewCreateFormValues) => {
      const type = viewTypes.find((viewType) => viewType.type === values.type);
      if (!type) {
        return;
      }

      let name = values.name;
      if (name === '') {
        name = type.name;
      }

      const nodes = workspace.collections.nodes;
      let maxIndex: string | null = null;
      nodes.forEach((node) => {
        if (node.type === 'database_view' && node.parentId === database.id) {
          const index = node.index;
          if (maxIndex === null || compareString(index, maxIndex) > 0) {
            maxIndex = index;
          }
        }
      });

      const viewId = generateId(IdType.DatabaseView);
      const view: LocalDatabaseViewNode = {
        id: viewId,
        type: 'database_view',
        name: name,
        parentId: database.id,
        layout: type.type,
        index: generateFractionalIndex(maxIndex, null),
        rootId: database.id,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };
      nodes.insert(view);
      return viewId;
    },
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!database.canEdit) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create view</DialogTitle>
          <DialogDescription>
            Create a new view to display your database records
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="grow space-y-4 py-2 pb-4">
            <FieldGroup>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid} className="flex-1">
                      <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Name"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="type"
                children={(field) => (
                  <div className="grid grid-cols-3 gap-4">
                    {viewTypes.map((viewType) => (
                      <div
                        role="presentation"
                        key={viewType.name}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-muted-foreground',
                          'hover:bg-accent cursor-pointer',
                          viewType.type === field.state.value
                            ? 'border-foreground text-foreground'
                            : ''
                        )}
                        onClick={() => {
                          field.handleChange(viewType.type);
                        }}
                      >
                        <viewType.icon />
                        <p>{viewType.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
