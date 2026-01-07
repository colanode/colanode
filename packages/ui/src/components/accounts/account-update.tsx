import { eq, useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { collections } from '@colanode/ui/collections';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().nullable(),
  email: z.email('Invalid email address'),
});

export const AccountUpdate = () => {
  const workspace = useWorkspace();
  const accountQuery = useLiveQuery(
    (q) =>
      q
        .from({ accounts: collections.accounts })
        .where(({ accounts }) => eq(accounts.id, workspace.accountId))
        .select(({ accounts }) => ({
          name: accounts.name,
          avatar: accounts.avatar,
          email: accounts.email,
        })),
    [workspace.accountId]
  );

  const isMobile = useIsMobile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation();
  const { mutate: updateAccount, isPending: isUpdatingAccount } = useMutation();

  const accountData = accountQuery.data?.[0];
  const form = useForm({
    defaultValues: {
      name: accountData?.name ?? '',
      email: accountData?.email ?? '',
      avatar: accountData?.avatar ?? null,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdatingAccount) {
        return;
      }

      updateAccount({
        input: {
          type: 'account.update',
          id: workspace.accountId,
          name: value.name,
          avatar: value.avatar,
        },
        onSuccess() {
          toast.success('Account updated');
        },
        onError(error) {
          toast.error(error.message);
        },
      });
    },
  });

  const handleAvatarClick = async () => {
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
            form.setFieldValue('avatar', output.id);
          }
        },
        onError(error) {
          toast.error(error.message);
        },
      });
    } else if (result.type === 'error') {
      toast.error(result.error);
    }
  };

  if (!accountData) {
    return <p>Account not found</p>;
  }

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className={cn('flex gap-1', isMobile ? 'flex-col' : 'flex-row')}>
        <div
          className={cn(
            'pt-3',
            isMobile ? 'flex justify-center pb-4' : 'size-40'
          )}
        >
          <div
            className="group relative cursor-pointer"
            onClick={handleAvatarClick}
          >
            <form.Subscribe
              selector={(state) => ({
                avatar: state.values.avatar,
                name: state.values.name,
              })}
              children={({ avatar, name }) => (
                <Avatar
                  id={workspace.accountId}
                  name={name}
                  avatar={avatar}
                  className={isMobile ? 'size-24' : 'size-32'}
                />
              )}
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
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="flex-1">
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      readOnly
                      placeholder="Email"
                      disabled
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>
      </div>

      <div className="flex flex-row justify-end gap-2">
        <Button
          type="submit"
          disabled={isUpdatingAccount || isUploadingAvatar}
          className="w-20"
        >
          {isUpdatingAccount && <Spinner className="mr-1" />}
          Save
        </Button>
      </div>
    </form>
  );
};
