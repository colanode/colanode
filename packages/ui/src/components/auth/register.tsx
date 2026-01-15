import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { LoginOutput } from '@colanode/core';
import { RegisterForm } from '@colanode/ui/components/auth/email-register-form';
import { EmailVerifyForm } from '@colanode/ui/components/auth/email-verify-form';
import { GoogleLogin } from '@colanode/ui/components/auth/google-login';
import { Button } from '@colanode/ui/components/ui/button';
import { useAuth } from '@colanode/ui/contexts/auth';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

type RegisterState =
  | {
      type: 'register';
    }
  | {
      type: 'verify';
      id: string;
      expiresAt: string;
    };

export const Register = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [state, setState] = useState<RegisterState>({ type: 'register' });

  const { mutate: mutateEmailRegister, isPending: isEmailRegisterPending } =
    useMutation();
  const { mutate: mutateEmailVerify, isPending: isEmailVerifyPending } =
    useMutation();
  const { mutate: mutateGoogleRegister, isPending: isGoogleRegisterPending } =
    useMutation();

  const handleRegisterSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (isEmailRegisterPending) return;
    if (isEmailVerifyPending || isGoogleRegisterPending) return;
    if (state.type !== 'register') return;

    mutateEmailRegister({
      input: {
        type: 'email.register',
        name: values.name,
        email: values.email,
        password: values.password,
        server: auth.server.domain,
      },
      onSuccess(output) {
        if (output.type === 'success') {
          if (output.workspaces.length > 0) {
            navigate({
              to: '/workspace/$userId',
              params: { userId: output.workspaces[0]!.user.id },
            });
          } else {
            navigate({ to: '/create' });
          }
        } else if (output.type === 'verify') {
          setState({
            type: 'verify',
            id: output.id,
            expiresAt: output.expiresAt,
          });
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleVerifySubmit = async (values: { otp: string }) => {
    if (isEmailVerifyPending) return;
    if (isEmailRegisterPending || isGoogleRegisterPending) return;
    if (state.type !== 'verify') return;

    mutateEmailVerify({
      input: {
        type: 'email.verify',
        otp: values.otp,
        server: auth.server.domain,
        id: state.id,
      },
      onSuccess(output: LoginOutput) {
        if (output.type === 'success') {
          navigate({
            to: '/workspace/$userId',
            params: { userId: output.workspaces[0]!.user.id },
          });
        } else if (output.type === 'verify') {
          setState({
            type: 'verify',
            id: output.id,
            expiresAt: output.expiresAt,
          });
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleGoogleRegister = async (code: string) => {
    if (isGoogleRegisterPending) return;
    if (isEmailRegisterPending || isEmailVerifyPending) return;
    if (state.type !== 'register') return;

    mutateGoogleRegister({
      input: { type: 'google.login', code, server: auth.server.domain },
      onSuccess(output) {
        if (output.type === 'success') {
          if (output.workspaces.length > 0) {
            navigate({
              to: '/workspace/$userId',
              params: { userId: output.workspaces[0]!.user.id },
            });
          } else {
            navigate({ to: '/create' });
          }
        } else if (output.type === 'verify') {
          setState({
            type: 'verify',
            id: output.id,
            expiresAt: output.expiresAt,
          });
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {state.type === 'register'
            ? 'Create an account'
            : 'Verify your email'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.type === 'register'
            ? 'Sign up to get started with Colanode'
            : 'Enter the code sent to your email'}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {state.type === 'register' && (
          <>
            <RegisterForm
              onSubmit={handleRegisterSubmit}
              isPending={isEmailRegisterPending}
            />
            <GoogleLogin
              context="register"
              onLogin={handleGoogleRegister}
              isPending={isGoogleRegisterPending}
            />
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                navigate({ to: '/auth/login' });
              }}
              type="button"
            >
              Already have an account? Login
            </Button>
          </>
        )}
        {state.type === 'verify' && (
          <>
            <EmailVerifyForm
              onSubmit={handleVerifySubmit}
              isPending={isEmailVerifyPending}
              expiresAt={state.expiresAt}
            />
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                setState({ type: 'register' });
              }}
              type="button"
            >
              Back to register
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
