import { useForm, useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';
import { z } from 'zod/v4';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { AvatarPopover } from '@colanode/ui/components/avatars/avatar-popover';
import { Button } from '@colanode/ui/components/ui/button';
import { Field, FieldError } from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  avatar: z.string().optional().nullable(),
});

export type DatabaseFormValues = z.infer<typeof formSchema>;

interface DatabaseFormProps {
  id: string;
  values: z.infer<typeof formSchema>;
  submitText: string;
  onCancel: () => void;
  onSubmit: (values: DatabaseFormValues) => void;
  readOnly?: boolean;
}

export const DatabaseForm = ({
  id,
  values,
  submitText,
  onCancel,
  onSubmit,
  readOnly = false,
}: DatabaseFormProps) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: values,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const name = useStore(form.store, (state) => state.values.name);
  const avatar = useStore(form.store, (state) => state.values.avatar);

  useEffect(() => {
    if (readOnly) return;

    const timeoutId = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [readOnly]);

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="grow flex flex-row items-end gap-2 py-2 pb-4">
        {readOnly ? (
          <Button type="button" variant="outline" size="icon">
            <Avatar id={id} name={name} avatar={avatar} className="h-6 w-6" />
          </Button>
        ) : (
          <AvatarPopover
            onPick={(newAvatar) => {
              if (newAvatar === values.avatar) return;

              form.setFieldValue('avatar', newAvatar);
            }}
          >
            <Button type="button" variant="outline" size="icon">
              <Avatar id={id} name={name} avatar={avatar} className="size-6" />
            </Button>
          </AvatarPopover>
        )}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="flex-1">
                <Input
                  ref={nameInputRef}
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  readOnly={readOnly}
                  placeholder="Name"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={readOnly}>
          {submitText}
        </Button>
      </div>
    </form>
  );
};
