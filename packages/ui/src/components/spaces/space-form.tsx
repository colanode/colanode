import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';

import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
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
import { Textarea } from '@colanode/ui/components/ui/textarea';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
  avatar: z.string().optional().nullable(),
});

export type SpaceFormValues = z.infer<typeof formSchema>;

interface SpaceFormProps {
  values?: SpaceFormValues;
  onSubmit: (values: SpaceFormValues) => void;
  isPending: boolean;
  onCancel?: () => void;
  saveText: string;
  readOnly?: boolean;
}

export const SpaceForm = ({
  values,
  onSubmit,
  isPending,
  onCancel,
  saveText,
  readOnly = false,
}: SpaceFormProps) => {
  const id = useRef(generateId(IdType.Space));
  const isMobile = useIsMobile();

  const form = useForm<SpaceFormValues>({
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
        <div className={cn('flex gap-1', isMobile ? 'flex-col' : 'flex-row')}>
          <AvatarPopover
            onPick={(avatar) => {
              form.setValue('avatar', avatar);
            }}
          >
            <div
              className={cn(
                'pt-3',
                isMobile ? 'flex justify-center pb-4' : 'size-40'
              )}
            >
              <div className="group relative cursor-pointer">
                <Avatar
                  id={id.current}
                  name={name.length > 0 ? name : 'New space'}
                  avatar={avatar}
                  className={isMobile ? 'size-24' : 'size-32'}
                />
                <div
                  className={cn(
                    `absolute left-0 top-0 hidden h-32 w-32 items-center justify-center overflow-hidden bg-accent/70 group-hover:inline-flex`,
                    readOnly && 'hidden group-hover:hidden'
                  )}
                >
                  <Edit className="size-5 text-foreground" />
                </div>
              </div>
            </div>
          </AvatarPopover>

          <div
            className={cn(
              'space-y-4 py-2 pb-4',
              isMobile ? 'w-full' : 'flex-grow'
            )}
          >
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
                      placeholder="Write a short description about the space"
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
                disabled={isPending}
                variant="outline"
                onClick={() => {
                  onCancel();
                }}
              >
                Cancel
              </Button>
            )}

            <Button type="submit" disabled={isPending} className="w-20">
              {saveText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
