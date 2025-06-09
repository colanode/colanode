import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@colanode/ui/components/ui/form';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
});

interface DatabaseFormProps {
  id: string;
  values: z.infer<typeof formSchema>;
  isPending: boolean;
  submitText: string;
  handleCancel: () => void;
  handleSubmit: (values: z.infer<typeof formSchema>) => void;
  readOnly?: boolean;
}

export const DatabaseForm = ({
  id,
  values,
  isPending,
  submitText,
  handleCancel,
  handleSubmit,
  readOnly = false,
}: DatabaseFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: values,
  });

  const name = form.watch('name');
  const avatar = form.watch('avatar');

  useEffect(() => {
    if (readOnly) return;

    const timeoutId = setTimeout(() => {
      form.setFocus('name');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [readOnly]);

  return (
    <Form {...form}>
      <form
        className="flex flex-col"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="flex-grow flex flex-row items-end gap-2 py-2 pb-4">
          {readOnly ? (
            <Button type="button" variant="outline" size="icon">
              <Avatar id={id} name={name} avatar={avatar} className="h-6 w-6" />
            </Button>
          ) : (
            <AvatarPopover
              onPick={(avatar) => {
                if (isPending) return;
                if (avatar === values.avatar) return;

                form.setValue('avatar', avatar);
              }}
            >
              <Button type="button" variant="outline" size="icon">
                <Avatar
                  id={id}
                  name={name}
                  avatar={avatar}
                  className="h-6 w-6"
                />
              </Button>
            </AvatarPopover>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input readOnly={readOnly} placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || readOnly}>
            {isPending && <Spinner className="mr-1" />}
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
