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
import { Label } from '@colanode/ui/components/ui/label';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useServer } from '@colanode/ui/contexts/server';
import { useCountdown } from '@colanode/ui/hooks/use-countdown';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const createFormSchema = (t: (key: string) => string) =>
  z
    .object({
      otp: z.string().min(6, 'OTP must be 6 characters long'),
      password: z
        .string()
        .min(8, t('auth.passwordRequirements.minLength'))
        .regex(/[A-Z]/, t('auth.passwordRequirements.uppercase'))
        .regex(/[a-z]/, t('auth.passwordRequirements.lowercase'))
        .regex(/[^A-Za-z0-9]/, t('auth.passwordRequirements.special')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.passwordRequirements.noMatch'),
      path: ['confirmPassword'],
    });

interface EmailPasswordResetCompleteProps {
  id: string;
  expiresAt: Date;
  onBack: () => void;
}

export const EmailPasswordResetComplete = ({
  id,
  expiresAt,
  onBack,
}: EmailPasswordResetCompleteProps) => {
  const { t } = useI18n();
  const server = useServer();
  const { mutate, isPending } = useMutation();

  const formSchema = createFormSchema(t);

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
      toast.error(t('ui.codeExpired'));
      return;
    }

    mutate({
      input: {
        type: 'email.password.reset.complete',
        otp: values.otp,
        password: values.password,
        server: server.domain,
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
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center border border-border rounded-md p-4 gap-3 text-center">
          <CheckCircle className="size-7 text-green-600" />
          <p className="text-sm text-muted-foreground">
            {t('auth.passwordResetSuccess')}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            {t('auth.loggedOutAllDevices')}
          </p>
        </div>
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={onBack}
          type="button"
        >
          {t('common.back')}
        </Button>
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
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  autoComplete="new-password"
                  placeholder={t('auth.passwordPlaceholder')}
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
              <Label htmlFor="confirmPassword">
                {t('auth.confirmNewPassword')}
              </Label>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  autoComplete="new-password"
                  placeholder={t('auth.passwordPlaceholder')}
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
              <Label htmlFor="otp">{t('auth.code')}</Label>
              <FormControl>
                <Input placeholder={t('auth.codePlaceholder')} {...field} />
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
            <Spinner className="mr-1 size-4" />
          ) : (
            <Lock className="mr-1 size-4" />
          )}
          {t('auth.resetPassword')}
        </Button>
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={onBack}
          type="button"
        >
          {t('common.back')}
        </Button>
      </form>
    </Form>
  );
};
