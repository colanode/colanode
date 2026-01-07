import { useForm, useStore } from '@tanstack/react-form';
import { Edit } from 'lucide-react';
import { useRef } from 'react';
import { z } from 'zod/v4';

import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
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

const defaultValues: SpaceFormValues = {
  name: '',
  description: '',
  avatar: null,
};

interface SpaceFormProps {
  values?: SpaceFormValues;
  onSubmit: (values: SpaceFormValues) => void;
  onCancel?: () => void;
  submitText: string;
  readOnly?: boolean;
}

export const SpaceForm = ({
  values,
  onSubmit,
  onCancel,
  submitText,
  readOnly = false,
}: SpaceFormProps) => {
  const id = useRef(generateId(IdType.Space));
  const isMobile = useIsMobile();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      ...values,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const name = useStore(form.store, (state) => state.values.name);
  const avatar = useStore(form.store, (state) => state.values.avatar);

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className={cn('flex gap-1', isMobile ? 'flex-col' : 'flex-row')}>
        <AvatarPopover
          onPick={(newAvatar) => {
            form.setFieldValue('avatar', newAvatar);
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
                      readOnly={readOnly}
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
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      readOnly={readOnly}
                      placeholder="Write a short description about the space"
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
      {!readOnly && (
        <div className="flex flex-row justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={readOnly} className="w-20">
            {submitText}
          </Button>
        </div>
      )}
    </form>
  );
};
