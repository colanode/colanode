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
import { useServer } from '@colanode/ui/contexts/server';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const formSchema = z.object({
  email: z.string().min(2).email(),
  password: z.string().min(8),
});

interface EmailLoginProps {
  onSuccess: (output: LoginOutput) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export const EmailLogin = ({
  onSuccess,
  onForgotPassword,
  onRegister,
}: EmailLoginProps) => {
  const server = useServer();
  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'email.login',
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="email">Email</Label>
              <FormControl>
                <Input
                  placeholder="hi@example.com"
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
              <div className="flex flex-row gap-2 items-center">
                <Label htmlFor="password">Password</Label>
                <p
                  className="text-xs text-muted-foreground cursor-pointer hover:underline w-full text-right"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </p>
              </div>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  autoComplete="current-password"
                  placeholder="********"
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
          Login
        </Button>
        <GoogleLogin context="login" onSuccess={onSuccess} />
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={onRegister}
          type="button"
        >
          No account yet? Register
        </Button>
      </form>
    </Form>
  );
};
