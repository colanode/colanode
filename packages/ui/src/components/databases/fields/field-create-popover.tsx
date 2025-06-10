import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

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
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const formSchema = z.object({
  name: z.string(),
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

export const FieldCreatePopover = () => {
  const [open, setOpen] = useState(false);
  const workspace = useWorkspace();
  const database = useDatabase();

  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'text',
    },
  });

  const type = form.watch('type');

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'field.create',
        databaseId: database.id,
        name: values.name,
        fieldType: values.type,
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        relationDatabaseId: values.relationDatabaseId,
      },
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  if (!database.canEdit) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger>
        <Plus className="ml-2 size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="mr-5 w-128" side="bottom">
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(handleSubmit)}
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
                        type={field.value}
                        onChange={field.onChange}
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
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
