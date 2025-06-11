import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

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
import { useCountdown } from '@colanode/ui/hooks/use-countdown';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const formSchema = z
  .object({
    otp: z.string().min(6, 'OTP must be 6 characters long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // path of error
  });

interface EmailPasswordResetCompleteProps {
  server: string;
  id: string;
  expiresAt: Date;
}

export const EmailPasswordResetComplete = ({
  server,
  id,
  expiresAt,
}: EmailPasswordResetCompleteProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [remainingSeconds, formattedTime] = useCountdown(expiresAt);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (remainingSeconds <= 0) {
      toast.error('Code has expired');
      return;
    }

    mutate({
      input: {
        type: 'email.password.reset.complete',
        otp: values.otp,
        password: values.password,
        server,
        id: id,
      },
      onSuccess() {
        setShowSuccess(true);
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center border border-border rounded-md p-4 gap-3 text-center">
        <CheckCircle className="size-7 text-green-600" />
        <p className="text-sm text-muted-foreground">
          Your password has been reset. You can now login with your new
          password.
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          You have been logged out of all devices.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="New Password"
                  {...field}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  {...field}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Code" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground w-full text-center">
                {formattedTime}
              </p>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Lock className="mr-2 size-4" />
          )}
          Reset password
        </Button>
      </form>
    </Form>
  );
};
