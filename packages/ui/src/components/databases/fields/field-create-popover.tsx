import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@colanode/ui/components/ui/form';
import { Input } from '@colanode/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'text',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FieldCreateFormValues) => {
      const nodes = appDatabase.workspace(workspace.userId).nodes;

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
        if (draft.attributes.type !== 'database') {
          return;
        }

        const maxIndex = Object.values(draft.attributes.fields)
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

        draft.attributes.fields[fieldId] = newField;
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

  const type = form.watch('type');

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  if (!database.canEdit) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent className="mr-5 w-128" side="bottom">
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit((values) => mutate(values))}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="name" placeholder="Field name" {...field} />
                    </FormControl>
                    <FormMessage>{formState.errors.name?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field type</FormLabel>
                    <FormControl>
                      <FieldTypeSelect
                        value={field.value}
                        onChange={field.onChange}
                        types={types}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {type === 'relation' && (
                <FormField
                  control={form.control}
                  name="relationDatabaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database</FormLabel>
                      <FormControl>
                        <DatabaseSelect
                          id={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
