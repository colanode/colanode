import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmailPasswordResetInitOutput } from '@colanode/core';
import { Server } from '@colanode/client/types';
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
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { toast } from '@colanode/ui/hooks/use-toast';

const formSchema = z.object({
  email: z.string().min(2).email(),
});

interface EmailPasswordResetInitProps {
  server: Server;
  onSuccess: (output: EmailPasswordResetInitOutput) => void;
}

export const EmailPasswordResetInit = ({
  server,
  onSuccess,
}: EmailPasswordResetInitProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    mutate({
      input: {
        type: 'email_password_reset_init',
        email: values.email,
        server: server.domain,
      },
      onSuccess(output) {
        onSuccess(output);
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
          Reset password
        </Button>
      </form>
    </Form>
  );
};
