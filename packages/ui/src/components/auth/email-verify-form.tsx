import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
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
  const { t } = useI18n();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
  });

  const [remainingSeconds, formattedTime] = useCountdown(expiresAt);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground w-full text-center">
                  {t('auth.verificationCodeSent')}
                </p>
                <p className="text-xs text-muted-foreground w-full text-center">
                  {formattedTime}
                </p>
              </div>
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
            <Mail className="mr-1 size-4" />
          )}
          {t('common.confirm')}
        </Button>
      </form>
    </Form>
  );
};
