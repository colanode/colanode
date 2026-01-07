import { useForm } from '@tanstack/react-form';
import { Mail } from 'lucide-react';
import { z } from 'zod/v4';

import { Button } from '@colanode/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@colanode/ui/components/ui/field';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useCountdown } from '@colanode/ui/hooks/use-countdown';

const formSchema = z.object({
  otp: z.string().min(2),
});

interface EmailVerifyFormProps {
  expiresAt: Date;
  isPending: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export const EmailVerifyForm = ({
  expiresAt,
  isPending,
  onSubmit,
}: EmailVerifyFormProps) => {
  const form = useForm({
    defaultValues: {
      otp: '',
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
      className="space-y-4"
    >
      <FieldGroup>
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
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm text-muted-foreground w-full text-center">
                    We sent a verification code to your email.
                  </p>
                  <p className="text-xs text-muted-foreground w-full text-center">
                    {formattedTime}
                  </p>
                </div>
              </Field>
            );
          }}
        />
      </FieldGroup>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={isPending || remainingSeconds <= 0}
      >
        {isPending ? (
          <Spinner className="mr-1 size-4" />
        ) : (
          <Mail className="mr-1 size-4" />
        )}
        Confirm
      </Button>
    </form>
  );
};
