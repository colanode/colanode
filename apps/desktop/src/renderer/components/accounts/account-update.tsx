import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar } from '@/renderer/components/avatars/avatar';
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
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { Account } from '@/shared/types/accounts';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
});

type formSchemaType = z.infer<typeof formSchema>;

export const AccountUpdate = ({ account }: { account: Account }) => {
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation();
  const { mutate: updateAccount, isPending: isUpdatingAccount } = useMutation();

  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);

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
        type: 'account_update',
        id: account.id,
        name: values.name,
        avatar: values.avatar,
      },
      onSuccess() {
        toast({
          title: 'Account updated',
          description: 'Account was updated successfully',
          variant: 'default',
        });
      },
      onError(error) {
        toast({
          title: 'Failed to update account',
          description: error.message,
          variant: 'destructive',
        });
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
                if (
                  isUpdatingAccount ||
                  isUploadingAvatar ||
                  isFileDialogOpen
                ) {
                  return;
                }

                setIsFileDialogOpen(true);
                const result = await window.colanode.executeCommand({
                  type: 'file_dialog_open',
                  options: {
                    properties: ['openFile'],
                    filters: [
                      { name: 'Images', extensions: ['jpg', 'png', 'jpeg'] },
                    ],
                  },
                });

                if (result.canceled || !result.filePaths.length) {
                  setIsFileDialogOpen(false);
                  return;
                }

                const filePath = result.filePaths[0];
                if (!filePath) {
                  setIsFileDialogOpen(false);
                  return;
                }

                uploadAvatar({
                  input: {
                    type: 'avatar_upload',
                    accountId: account.id,
                    filePath: filePath,
                  },
                  onSuccess(output) {
                    if (output.id) {
                      form.setValue('avatar', output.id);
                    }
                    setIsFileDialogOpen(false);
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to upload avatar',
                      description: error.message,
                      variant: 'destructive',
                    });
                    setIsFileDialogOpen(false);
                  },
                });
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
