import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { EmailPasswordResetInitOutput } from '@colanode/core';
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
});

interface EmailPasswordResetInitProps {
  onSuccess: (output: EmailPasswordResetInitOutput) => void;
  onBack: () => void;
}

export const EmailPasswordResetInit = ({
  onSuccess,
  onBack,
}: EmailPasswordResetInitProps) => {
  const server = useServer();
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
        type: 'email.password.reset.init',
        email: values.email,
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="email">Email</Label>
              <FormControl>
                <Input placeholder="hi@example.com" {...field} />
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
          Reset password
        </Button>
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={onBack}
          type="button"
        >
          Back to login
        </Button>
      </form>
    </Form>
  );
};
