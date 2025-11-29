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
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { Textarea } from '@colanode/ui/components/ui/textarea';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
  avatar: z.string().optional().nullable(),
});

type formSchemaType = z.infer<typeof formSchema>;

interface SpaceFormProps {
  values?: formSchemaType;
  onSubmit: (values: formSchemaType) => void;
  isSaving: boolean;
  onCancel?: () => void;
  saveText: string;
  readOnly?: boolean;
}

export const SpaceForm = ({
  values,
  onSubmit,
  isSaving,
  onCancel,
  saveText,
  readOnly = false,
}: SpaceFormProps) => {
  const { t } = useI18n();
  const id = useRef(generateId(IdType.Space));
  const isMobile = useIsMobile();

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
                  name={name.length > 0 ? name : t('database.newSpace')}
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
            className={cn('space-y-4 py-2 pb-4', isMobile ? 'w-full' : 'grow')}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{t('common.name')} *</FormLabel>
                  <FormControl>
                    <Input
                      readOnly={readOnly}
                      placeholder={t('common.name')}
                      {...field}
                    />
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
                  <FormLabel>{t('misc.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      readOnly={readOnly}
                      placeholder={t('space.descriptionPlaceholder')}
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
                disabled={isSaving}
                variant="outline"
                onClick={() => {
                  onCancel();
                }}
              >
                {t('common.cancel')}
              </Button>
            )}

            <Button type="submit" disabled={isSaving} className="w-20">
              {isSaving && <Spinner className="mr-1" />}
              {saveText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
