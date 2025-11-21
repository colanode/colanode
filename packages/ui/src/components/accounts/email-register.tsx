import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { LoginOutput } from '@colanode/core';
import { GoogleLogin } from '@colanode/ui/components/accounts/google-login';
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
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const createFormSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(2),
      email: z.string().min(2).email(),
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

interface EmailRegisterProps {
  onSuccess: (output: LoginOutput) => void;
  onLogin: () => void;
}

export const EmailRegister = ({ onSuccess, onLogin }: EmailRegisterProps) => {
  const { t } = useI18n();
  const server = useServer();
  const { mutate, isPending } = useMutation();

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'email.register',
        name: values.name,
        email: values.email,
        password: values.password,
        server: server.domain,
      },
      onSuccess(output) {
        onSuccess(output);
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="name">{t('common.name')}</Label>
              <FormControl>
                <Input
                  placeholder={t('auth.namePlaceholder')}
                  {...field}
                  autoComplete="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="email">{t('common.email')}</Label>
              <FormControl>
                <Input
                  placeholder={t('auth.emailPlaceholder')}
                  {...field}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="password">{t('common.password')}</Label>
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
                {t('common.confirmPassword')}
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
          {t('common.register')}
        </Button>
        <GoogleLogin context="register" onSuccess={onSuccess} />
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={onLogin}
          type="button"
        >
          {t('auth.hasAccount')}
        </Button>
      </form>
    </Form>
  );
};
