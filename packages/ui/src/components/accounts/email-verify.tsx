import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoginOutput } from '@colanode/core';
import { Server } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@colanode/ui/components/ui/form';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { toast } from '@colanode/ui/hooks/use-toast';
import { useCountdown } from '@colanode/ui/hooks/use-countdown';

const formSchema = z.object({
  otp: z.string().min(2),
});

interface EmailVerifyProps {
  server: Server;
  id: string;
  expiresAt: Date;
  onSuccess: (output: LoginOutput) => void;
}

export const EmailVerify = ({
  server,
  id,
  expiresAt,
  onSuccess,
}: EmailVerifyProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
  });

  const [remainingSeconds, formattedTime] = useCountdown(expiresAt);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (remainingSeconds <= 0) {
      toast({
        title: 'Code has expired',
        description: 'Please request a new code',
        variant: 'destructive',
      });
      return;
    }

    mutate({
      input: {
        type: 'email_verify',
        otp: values.otp,
        server: server.domain,
        id,
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
          name="otp"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <p className="text-sm text-muted-foreground w-full text-center">
                Write the code you received in your email
              </p>
              <FormControl>
                <Input placeholder="Code" {...field} />
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
            <Spinner className="mr-2 size-4" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Confirm
        </Button>
      </form>
    </Form>
  );
};
