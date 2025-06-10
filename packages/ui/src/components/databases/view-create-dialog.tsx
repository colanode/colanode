import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Columns, Table } from 'lucide-react';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { FieldAttributes, FieldType } from '@colanode/core';
import { FieldSelect } from '@colanode/ui/components/databases/fields/field-select';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@colanode/ui/components/ui/form';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  type: z.enum(['table', 'board', 'calendar']),
  groupBy: z.string().optional().nullable(),
});

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

const boardGroupFields: FieldType[] = ['select'];
const calendarGroupFields: FieldType[] = ['date', 'created_at'];

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
  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'table',
    },
  });
  const type = form.watch('type');

  let groupByFields: FieldAttributes[] | null = null;
  if (type === 'board') {
    groupByFields = database.fields.filter((field) =>
      boardGroupFields.includes(field.type)
    );
  } else if (type === 'calendar') {
    groupByFields = database.fields.filter((field) =>
      calendarGroupFields.includes(field.type)
    );
  }

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    if (values.type === 'board') {
      if (!values.groupBy) {
        toast.error(
          'You need to specify a group by field to create a board view'
        );
        return;
      }
    } else if (values.type === 'calendar') {
      if (!values.groupBy) {
        toast.error(
          'You need to specify a group by field to create a calendar view'
        );
        return;
      }
    }

    mutate({
      input: {
        type: 'view.create',
        viewType: values.type,
        databaseId: database.id,
        name: values.name,
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        groupBy: values.groupBy ?? null,
      },
      onSuccess() {
        form.reset();
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create view</DialogTitle>
          <DialogDescription>
            Create a new view to display your database records
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-4">
                    {viewTypes.map((viewType) => (
                      <div
                        role="presentation"
                        key={viewType.name}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-muted-foreground',
                          'hover:border-gray-500 hover:bg-gray-50 cursor-pointer',
                          viewType.type === field.value
                            ? 'border-gray-500 text-primary'
                            : ''
                        )}
                        onClick={() => {
                          field.onChange(viewType.type);
                          form.setValue('groupBy', null);
                        }}
                      >
                        <viewType.icon />
                        <p>{viewType.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
              {groupByFields && (
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <FormControl>
                        <FieldSelect
                          fields={groupByFields}
                          value={field.value ?? null}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};
