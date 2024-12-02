import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { FieldAttrs } from '@/renderer/components/databases/fields/field-attrs';
import { FieldTypeSelect } from '@/renderer/components/databases/fields/field-type-select';
import { Button } from '@/renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useDatabase } from '@/renderer/contexts/database';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

const formSchema = z.object({
  name: z.string(),
  type: z.union([
    z.literal('boolean'),
    z.literal('collaborator'),
    z.literal('createdAt'),
    z.literal('createdBy'),
    z.literal('date'),
    z.literal('email'),
    z.literal('file'),
    z.literal('multiSelect'),
    z.literal('number'),
    z.literal('phone'),
    z.literal('select'),
    z.literal('text'),
    z.literal('updatedAt'),
    z.literal('updatedBy'),
    z.literal('url'),
  ]),
});

export const FieldCreatePopover = () => {
  const [open, setOpen] = React.useState(false);
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

  const handleCancelClick = () => {
    setOpen(false);
    form.reset();
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'field_create',
        databaseId: database.id,
        name: values.name,
        fieldType: values.type,
        userId: workspace.userId,
      },
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
      onError(error) {
        toast({
          title: 'Failed to create field',
          description: error.message,
          variant: 'destructive',
        });
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
              <FieldAttrs />
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
