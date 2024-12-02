import { generateId, IdType } from '@colanode/core';
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
import { Textarea } from '@/renderer/components/ui/textarea';
import { useAccount } from '@/renderer/contexts/account';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { cn } from '@/shared/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
  avatar: z.string().optional().nullable(),
});

type formSchemaType = z.infer<typeof formSchema>;

interface WorkspaceFormProps {
  values?: formSchemaType;
  onSubmit: (values: formSchemaType) => void;
  isSaving: boolean;
  onCancel?: () => void;
  saveText: string;
  readOnly?: boolean;
}

export const WorkspaceForm = ({
  values,
  onSubmit,
  isSaving,
  onCancel,
  saveText,
  readOnly = false,
}: WorkspaceFormProps) => {
  const account = useAccount();

  const id = React.useRef(generateId(IdType.Workspace));
  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);
  const { mutate, isPending } = useMutation();

  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: values?.name ?? '',
      description: values?.description ?? '',
      avatar: values?.avatar,
    },
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-1">
          <div className="h-40 w-40 pt-3">
            <div
              className="group relative cursor-pointer"
              onClick={async () => {
                if (isPending || isFileDialogOpen || readOnly) {
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

                mutate({
                  input: {
                    type: 'avatar_upload',
                    accountId: account.id,
                    filePath: filePath,
                  },
                  onSuccess(output) {
                    form.setValue('avatar', output.id);
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
                id={id.current}
                name={name.length > 0 ? name : 'New workspace'}
                avatar={avatar}
                className="h-32 w-32"
              />
              <div
                className={cn(
                  `absolute left-0 top-0 hidden h-32 w-32 items-center justify-center overflow-hidden bg-gray-50 group-hover:inline-flex`,
                  isPending ? 'inline-flex' : 'hidden',
                  readOnly && 'hidden group-hover:hidden'
                )}
              >
                {isPending ? (
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
                    <Input readOnly={readOnly} placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      readOnly={readOnly}
                      placeholder="Write a short description about the workspace"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-row justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                disabled={isPending || isSaving}
                variant="outline"
                onClick={() => {
                  onCancel();
                }}
              >
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={isPending || isSaving}>
              {isSaving && <Spinner className="mr-1" />}
              {saveText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
