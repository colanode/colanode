import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onClick={() => {
                    navigate({ to: '/auth/reset' });
                  }}
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
      </form>
    </Form>
  );
};
