import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { LoginOutput } from '@colanode/core';
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
import { useCountdown } from '@colanode/ui/hooks/use-countdown';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const formSchema = z.object({
  otp: z.string().min(2),
});

interface EmailVerifyProps {
  id: string;
  expiresAt: Date;
  onSuccess: (output: LoginOutput) => void;
  onBack: () => void;
}

export const EmailVerify = ({
  id,
  expiresAt,
  onSuccess,
  onBack,
}: EmailVerifyProps) => {
  const server = useServer();
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
      toast.error('Code has expired');
      return;
    }

    mutate({
      input: {
        type: 'email.verify',
        otp: values.otp,
        server: server.domain,
        id,
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
          name="otp"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="otp">Code</Label>
              <FormControl>
                <Input placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground w-full text-center">
                  We sent a verification code to your email.
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
          Confirm
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
