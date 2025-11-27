import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Columns, Table } from 'lucide-react';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

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
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string(),
  type: z.enum(['table', 'board', 'calendar']),
});

interface ViewTypeOption {
  name: string;
  icon: FC;
  type: 'table' | 'board' | 'calendar';
}

const getViewTypes = (t: (key: string) => string): ViewTypeOption[] => [
  {
    name: t('view.table'),
    icon: Table,
    type: 'table',
  },
  {
    name: t('view.board'),
    icon: Columns,
    type: 'board',
  },
  {
    name: t('view.calendar'),
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
  const { t } = useI18n();
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();
  const viewTypes = getViewTypes(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'table',
    },
  });

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    const type = viewTypes.find((viewType) => viewType.type === values.type);
    if (!type) {
      return;
    }

    let name = values.name;
    if (name === '') {
      name = type.name;
    }

    mutate({
      input: {
        type: 'view.create',
        viewType: type.type,
        databaseId: database.id,
        name: name,
        userId: workspace.userId,
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
          <DialogTitle>{t('view.createView')}</DialogTitle>
          <DialogDescription>
            {t('view.createViewDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('account.nameRequired')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('common.name')} {...field} />
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
                          'hover:bg-accent cursor-pointer',
                          viewType.type === field.value
                            ? 'border-foreground text-foreground'
                            : ''
                        )}
                        onClick={() => {
                          field.onChange(viewType.type);
                        }}
                      >
                        <viewType.icon />
                        <p>{viewType.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
