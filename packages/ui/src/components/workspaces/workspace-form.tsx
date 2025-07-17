import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { generateId, IdType } from '@colanode/core';
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
import { Textarea } from '@colanode/ui/components/ui/textarea';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

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

  const id = useRef(generateId(IdType.Workspace));
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
                if (isPending || readOnly) {
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

                  mutate({
                    input: {
                      type: 'avatar.upload',
                      accountId: account.id,
                      file,
                    },
                    onSuccess(output) {
                      form.setValue('avatar', output.id);
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

            <Button
              type="submit"
              disabled={isPending || isSaving}
              className="w-20"
            >
              {isSaving && <Spinner className="mr-1" />}
              {saveText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
