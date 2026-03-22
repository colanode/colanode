import { useForm } from '@tanstack/react-form';
import { Lock } from 'lucide-react';
import { z } from 'zod/v4';

import { newPasswordSchema } from '@colanode/core/types/auth';
import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useCountdown } from '@colanode/ui/hooks/use-countdown';

const formSchema = z
  .object({
    otp: z.string().min(6, 'OTP must be 6 characters long'),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // path of error
  });

interface PasswordResetCompleteFormProps {
  expiresAt: string;
  isPending: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export const PasswordResetCompleteForm = ({
  expiresAt,
  isPending,
  onSubmit,
}: PasswordResetCompleteFormProps) => {
  const form = useForm({
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const [remainingSeconds, formattedTime] = useCountdown(expiresAt);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-3"
    >
      <form.Field
        name="password"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                autoComplete="new-password"
                placeholder="********"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />
      <form.Field
        name="confirmPassword"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Confirm New Password</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                autoComplete="new-password"
                placeholder="********"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />
      <form.Field
        name="otp"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Code</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="123456"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              <p className="text-xs text-muted-foreground w-full text-center">
                {formattedTime}
              </p>
            </Field>
          );
        }}
      />
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={isPending || remainingSeconds <= 0}
      >
        {isPending ? (
          <Spinner className="mr-1 size-4" />
        ) : (
          <Lock className="mr-1 size-4" />
        )}
        Reset password
      </Button>
    </form>
  );
};
