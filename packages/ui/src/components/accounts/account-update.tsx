import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { Account } from '@colanode/client/types';
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
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
});

type formSchemaType = z.infer<typeof formSchema>;

export const AccountUpdate = ({ account }: { account: Account }) => {
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation();
  const { mutate: updateAccount, isPending: isUpdatingAccount } = useMutation();

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account.name,
      avatar: account.avatar,
      email: account.email,
    },
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  const onSubmit = (values: formSchemaType) => {
    if (isUpdatingAccount) {
      return;
    }

    updateAccount({
      input: {
        type: 'account.update',
        id: account.id,
        name: values.name,
        avatar: values.avatar,
      },
      onSuccess() {
        toast.success('Account updated');
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-1">
          <div className="h-40 w-40 pt-3">
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
                      accountId: account.id,
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
                id={account.id}
                name={name}
                avatar={avatar}
                className="h-32 w-32"
              />
              <div
                className={cn(
                  `absolute left-0 top-0 hidden h-32 w-32 items-center justify-center overflow-hidden bg-gray-50 group-hover:inline-flex`,
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
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input readOnly placeholder="Email" {...field} disabled />
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
          >
            {isUpdatingAccount && <Spinner className="mr-1" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
};
