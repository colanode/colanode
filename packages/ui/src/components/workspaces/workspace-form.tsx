import { useForm } from '@tanstack/react-form';
import { Upload } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { Textarea } from '@colanode/ui/components/ui/textarea';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';
import { cn } from '@colanode/ui/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  description: z.string(),
  avatar: z.string().optional().nullable(),
});

type WorkspaceFormValues = z.infer<typeof formSchema>;

const defaultValues: WorkspaceFormValues = {
  name: '',
  description: '',
  avatar: null,
};

interface WorkspaceFormProps {
  values?: WorkspaceFormValues;
  onSubmit: (values: WorkspaceFormValues) => void;
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
  const workspace = useWorkspace();
  const isMobile = useIsMobile();

  const id = useRef(generateId(IdType.Workspace));
  const { mutate, isPending } = useMutation();

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

  const handleAvatarClick = async () => {
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
          accountId: workspace.accountId,
          file,
        },
        onSuccess(output) {
          form.setFieldValue('avatar', output.id);
        },
        onError(error) {
          toast.error(error.message);
        },
      });
    } else if (result.type === 'error') {
      toast.error(result.error);
    }
  };

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className={cn('flex gap-1', isMobile ? 'flex-col' : 'flex-row')}>
        <div
          className={cn(
            'pt-3',
            isMobile ? 'flex justify-center pb-4' : 'size-40'
          )}
        >
          <div
            className="group relative cursor-pointer"
            onClick={handleAvatarClick}
          >
            <form.Subscribe
              selector={(state) => ({
                avatar: state.values.avatar,
                name: state.values.name,
              })}
              children={({ avatar, name }) => (
                <Avatar
                  id={id.current}
                  name={name.length > 0 ? name : 'New workspace'}
                  avatar={avatar}
                  className={isMobile ? 'size-24' : 'size-32'}
                />
              )}
            />
            <div
              className={cn(
                `absolute left-0 top-0 hidden items-center justify-center overflow-hidden bg-accent/70 group-hover:inline-flex`,
                isMobile ? 'size-24' : 'size-32',
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
                      placeholder="Write a short description about the workspace"
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
  );
};
