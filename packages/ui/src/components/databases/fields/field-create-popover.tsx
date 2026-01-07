import { useForm, useStore } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  compareString,
  FieldAttributes,
  FieldType,
  generateFractionalIndex,
  generateId,
  IdType,
} from '@colanode/core';
import { DatabaseSelect } from '@colanode/ui/components/databases/database-select';
import { FieldTypeSelect } from '@colanode/ui/components/databases/fields/field-type-select';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.union([
    z.literal('boolean'),
    z.literal('collaborator'),
    z.literal('created_at'),
    z.literal('created_by'),
    z.literal('date'),
    z.literal('email'),
    z.literal('file'),
    z.literal('multi_select'),
    z.literal('number'),
    z.literal('phone'),
    z.literal('select'),
    z.literal('text'),
    z.literal('relation'),
    z.literal('updated_at'),
    z.literal('updated_by'),
    z.literal('url'),
  ]),
  relationDatabaseId: z.string().optional().nullable(),
});

const defaultValues: FieldCreateFormValues = {
  name: '',
  type: 'text',
  relationDatabaseId: null,
};

type FieldCreateFormValues = z.infer<typeof formSchema>;

interface FieldCreatePopoverProps {
  button: React.ReactNode;
  onSuccess?: (fieldId: string) => void;
  types?: FieldType[];
}

export const FieldCreatePopover = ({
  button,
  onSuccess,
  types,
}: FieldCreatePopoverProps) => {
  const [open, setOpen] = useState(false);
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

  const type = useStore(form.store, (state) => state.values.type);

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FieldCreateFormValues) => {
      const nodes = workspace.collections.nodes;

      if (values.type === 'relation') {
        if (!values.relationDatabaseId) {
          throw new MutationError(
            MutationErrorCode.RelationDatabaseNotFound,
            'Relation database not found.'
          );
        }

        const relationDatabase = nodes.get(values.relationDatabaseId);
        if (!relationDatabase || relationDatabase.type !== 'database') {
          throw new MutationError(
            MutationErrorCode.RelationDatabaseNotFound,
            'Relation database not found.'
          );
        }
      }

      if (!nodes.has(database.id)) {
        return null;
      }

      const fieldId = generateId(IdType.Field);
      nodes.update(database.id, (draft) => {
        if (draft.type !== 'database') {
          return;
        }

        const maxIndex = Object.values(draft.fields)
          .map((field) => field.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateFractionalIndex(maxIndex, null);

        const newField: FieldAttributes = {
          id: fieldId,
          type: values.type as FieldType,
          name: values.name,
          index,
        };

        if (newField.type === 'relation') {
          newField.databaseId = values.relationDatabaseId;
        }

        draft.fields[fieldId] = newField;
      });

      return fieldId;
    },
    onSuccess: (fieldId) => {
      form.reset();
      setOpen(false);

      if (fieldId) {
        onSuccess?.(fieldId);
      }
    },
    onError: (error) => {
      toast.error(error.message as string);
    },
  });

  if (!database.canEdit) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent className="mr-5 w-lg" side="bottom">
        <form
          className="flex flex-col gap-2"
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
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Field name"
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
                  <Field>
                    <FieldLabel htmlFor={field.name}>Field type</FieldLabel>
                    <FieldTypeSelect
                      value={field.state.value}
                      onChange={(value) =>
                        field.handleChange(
                          value as FieldCreateFormValues['type']
                        )
                      }
                      types={types}
                    />
                  </Field>
                )}
              />
              {type === 'relation' && (
                <form.Field
                  name="relationDatabaseId"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Database</FieldLabel>
                      <DatabaseSelect
                        id={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                      />
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          </div>
          <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Spinner className="mr-1" />}
              Create
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
