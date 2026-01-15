import { useNavigate } from '@tanstack/react-router';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EmailPasswordResetInitOutput } from '@colanode/core';
import { PasswordResetCompleteForm } from '@colanode/ui/components/auth/email-password-reset-complete-form';
import { PasswordResetInitForm } from '@colanode/ui/components/auth/email-password-reset-init-form';
import { Button } from '@colanode/ui/components/ui/button';
import { useAuth } from '@colanode/ui/contexts/auth';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

type ResetState =
  | {
      type: 'init';
    }
  | {
      type: 'complete';
      id: string;
      expiresAt: string;
    }
  | {
      type: 'success';
    };

export const Reset = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [state, setState] = useState<ResetState>({ type: 'init' });

  const {
    mutate: mutatePasswordResetInit,
    isPending: isPasswordResetInitPending,
  } = useMutation();
  const {
    mutate: mutatePasswordResetComplete,
    isPending: isPasswordResetCompletePending,
  } = useMutation();

  const handleInitSubmit = async (values: { email: string }) => {
    if (isPasswordResetInitPending) return;
    if (isPasswordResetCompletePending) return;
    if (state.type !== 'init') return;

    mutatePasswordResetInit({
      input: {
        type: 'email.password.reset.init',
        email: values.email,
        server: auth.server.domain,
      },
      onSuccess(output: EmailPasswordResetInitOutput) {
        setState({
          type: 'complete',
          id: output.id,
          expiresAt: output.expiresAt,
        });
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleCompleteSubmit = async (values: {
    otp: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (isPasswordResetCompletePending) return;
    if (isPasswordResetInitPending) return;
    if (state.type !== 'complete') return;

    mutatePasswordResetComplete({
      input: {
        type: 'email.password.reset.complete',
        otp: values.otp,
        password: values.password,
        server: auth.server.domain,
        id: state.id,
      },
      onSuccess() {
        setState({ type: 'success' });
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {state.type === 'init'
            ? 'Reset your password'
            : state.type === 'complete'
              ? 'Reset your password'
              : 'Password reset successful'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.type === 'init'
            ? 'Enter your email to receive a password reset code'
            : state.type === 'complete'
              ? 'Enter the code sent to your email and your new password'
              : 'Your password has been reset. You can now login with your new password.'}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {state.type === 'init' && (
          <>
            <PasswordResetInitForm
              onSubmit={handleInitSubmit}
              isPending={isPasswordResetInitPending}
            />
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                navigate({ to: '/auth/login' });
              }}
              type="button"
            >
              Back to login
            </Button>
          </>
        )}
        {state.type === 'complete' && (
          <>
            <PasswordResetCompleteForm
              onSubmit={handleCompleteSubmit}
              isPending={isPasswordResetCompletePending}
              expiresAt={state.expiresAt}
            />
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                setState({ type: 'init' });
              }}
              type="button"
            >
              Back to email input
            </Button>
          </>
        )}
        {state.type === 'success' && (
          <>
            <div className="flex flex-col items-center justify-center border border-border rounded-md p-4 gap-3 text-center">
              <CheckCircle className="size-7 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Your password has been reset. You can now login with your new
                password.
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                You have been logged out of all devices.
              </p>
            </div>
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                navigate({ to: '/auth/login' });
              }}
              type="button"
            >
              Back to login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
