import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { useCountdown } from '@colanode/ui/hooks/use-countdown';

const getFormSchema = (t: (key: string) => string) =>
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
      path: ['confirmPassword'], // path of error
    });

interface PasswordResetCompleteFormProps {
  expiresAt: Date;
  isPending: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export const PasswordResetCompleteForm = ({
  expiresAt,
  isPending,
  onSubmit,
}: PasswordResetCompleteFormProps) => {
  const { t } = useI18n();
  const formSchema = getFormSchema(t);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const [remainingSeconds, formattedTime] = useCountdown(expiresAt);

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
          disabled={isPending || remainingSeconds <= 0}
        >
          {isPending ? (
            <Spinner className="mr-1 size-4" />
          ) : (
            <Lock className="mr-1 size-4" />
          )}
          {t('auth.resetPassword')}
        </Button>
      </form>
    </Form>
  );
};
