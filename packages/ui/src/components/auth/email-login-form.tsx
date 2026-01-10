import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import { z } from 'zod/v4';

import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';

const formSchema = z.object({
  email: z.string().min(2).email(),
  password: z.string().min(8),
});

interface LoginFormProps {
  isPending: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export const LoginForm = ({ isPending, onSubmit }: LoginFormProps) => {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="email"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="hi@example.com"
                autoComplete="email"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />
      <form.Field
        name="password"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex flex-row gap-2 items-center">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <p
                  className="text-xs text-muted-foreground cursor-pointer hover:underline w-full text-right"
                  onClick={() => {
                    navigate({ to: '/auth/reset' });
                  }}
                >
                  Forgot password?
                </p>
              </div>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                autoComplete="current-password"
                placeholder="********"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <Spinner className="mr-1 size-4" />
        ) : (
          <Mail className="mr-1 size-4" />
        )}
        Login
      </Button>
    </form>
  );
};
