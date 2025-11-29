import { zodResolver } from '@hookform/resolvers/zod';
import { eq, useLiveQuery } from '@tanstack/react-db';
import { Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
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
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
  email: z.email('Invalid email address'),
});

export const AccountUpdate = () => {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const accountQuery = useLiveQuery((q) =>
    q
      .from({ accounts: collections.accounts })
      .where(({ accounts }) => eq(accounts.id, workspace.accountId))
      .select(({ accounts }) => ({
        name: accounts.name,
        avatar: accounts.avatar,
        email: accounts.email,
      }))
  );

  const isMobile = useIsMobile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation();
  const { mutate: updateAccount, isPending: isUpdatingAccount } = useMutation();

  const accountData = accountQuery.data?.[0];
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: accountData?.name,
      avatar: accountData?.avatar,
      email: accountData?.email,
    },
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  const onSubmit = (values: z.output<typeof formSchema>) => {
    if (isUpdatingAccount) {
      return;
    }

    updateAccount({
      input: {
        type: 'account.update',
        id: workspace.accountId,
        name: values.name,
        avatar: values.avatar,
      },
      onSuccess() {
        toast.success(t('ui.accountUpdated'));
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  if (!accountData) {
    return <p>{t('status.notFound')}</p>;
  }

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className={cn('flex gap-1', isMobile ? 'flex-col' : 'flex-row')}>
          <div
            className={cn(
              'pt-3',
              isMobile ? 'flex justify-center pb-4' : 'size-40'
            )}
          >
            <div
              className="group relative cursor-pointer"
              onClick={async () => {
                if (isUpdatingAccount || isUploadingAvatar) {
                  return;
                }

                const result = await openFileDialog({
                  accept: 'image/jpeg, image/jpg, image/png, image/webp',
                });

                if (result.type === 'success') {
                  const file = result.files[0];
                  if (!file) {
                    return;
                  }

                  uploadAvatar({
                    input: {
                      type: 'avatar.upload',
                      accountId: workspace.accountId,
                      file,
                    },
                    onSuccess(output) {
                      if (output.id) {
                        form.setValue('avatar', output.id);
                      }
                    },
                    onError(error) {
                      toast.error(error.message);
                    },
                  });
                } else if (result.type === 'error') {
                  toast.error(result.error);
                }
              }}
            >
              <Avatar
                id={workspace.accountId}
                name={name}
                avatar={avatar}
                className={isMobile ? 'size-24' : 'size-32'}
              />
              <div
                className={cn(
                  `absolute left-0 top-0 hidden items-center justify-center overflow-hidden bg-accent/50 group-hover:inline-flex`,
                  isMobile ? 'size-24' : 'size-32',
                  isUploadingAvatar ? 'inline-flex' : 'hidden'
                )}
              >
                {isUploadingAvatar ? (
                  <Spinner className="size-5" />
                ) : (
                  <Upload className="size-5 text-foreground" />
                )}
              </div>
            </div>
          </div>
          <div
            className={cn('space-y-4 py-2 pb-4', isMobile ? 'w-full' : 'grow')}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{t('account.nameRequired')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('account.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{t('common.email')}</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      placeholder={t('account.emailPlaceholder')}
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-row justify-end gap-2">
          <Button
            type="submit"
            disabled={isUpdatingAccount || isUploadingAvatar}
            className="w-20"
          >
            {isUpdatingAccount && <Spinner className="mr-1" />}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
