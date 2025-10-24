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

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
});

export type PageFormValues = z.infer<typeof formSchema>;

interface PageFormProps {
  id: string;
  values: PageFormValues;
  isPending: boolean;
  submitText: string;
  onCancel: () => void;
  onSubmit: (values: PageFormValues) => void;
  readOnly?: boolean;
}

export const PageForm = ({
  id,
  values,
  isPending,
  submitText,
  onCancel,
  onSubmit,
  readOnly = false,
}: PageFormProps) => {
  const form = useForm<PageFormValues>({
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
      <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
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
                  className="size-6"
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
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || readOnly}>
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  );
};
