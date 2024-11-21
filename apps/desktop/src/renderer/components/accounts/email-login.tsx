import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/renderer/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/renderer/hooks/use-toast';
import { Server } from '@/shared/types/servers';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        if (output.success) {
          const userId = output.workspaces[0]?.id ?? '';
          navigate(`/${output.account.id}/${userId}`);
        } else {
          toast({
            title: 'Failed to login',
            description: 'Invalid email or password.',
            variant: 'destructive',
          });
        }
      },
      onError() {
        toast({
          title: 'Failed to login',
          description:
            'Something went wrong trying to login. Please try again.',
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
