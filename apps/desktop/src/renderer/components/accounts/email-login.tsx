import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { Server } from '@/shared/types/servers';

const formSchema = z.object({
  email: z.string().min(2).email(),
  password: z.string().min(8),
});

interface EmailLoginProps {
  server: Server;
}

export const EmailLogin = ({ server }: EmailLoginProps) => {
  const navigate = useNavigate();
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
        type: 'email_login',
        email: values.email,
        password: values.password,
        server: server.domain,
      },
      onSuccess(output) {
        const userId = output.workspaces[0]?.id ?? '';
        navigate(`/${output.account.id}/${userId}`);
      },
      onError(error) {
        toast({
          title: 'Failed to login',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
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
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
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
            <Spinner className="mr-2 size-4" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Login
        </Button>
      </form>
    </Form>
  );
};
