import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { LoginOutput } from '@colanode/core';
import { LoginForm } from '@colanode/ui/components/auth/email-login-form';
import { EmailVerifyForm } from '@colanode/ui/components/auth/email-verify-form';
import { GoogleLogin } from '@colanode/ui/components/auth/google-login';
import { ServerDropdown } from '@colanode/ui/components/servers/server-dropdown';
import { Button } from '@colanode/ui/components/ui/button';
import { useAuth } from '@colanode/ui/contexts/auth';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

type LoginState =
  | {
      type: 'login';
    }
  | {
      type: 'verify';
      id: string;
      expiresAt: Date;
    };

export const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [state, setState] = useState<LoginState>({ type: 'login' });

  const { mutate: mutateEmailLogin, isPending: isEmailLoginPending } =
    useMutation();
  const { mutate: mutateEmailVerify, isPending: isEmailVerifyPending } =
    useMutation();
  const { mutate: mutateGoogleLogin, isPending: isGoogleLoginPending } =
    useMutation();

  const handleLoginSubmit = async (values: {
    email: string;
    password: string;
  }) => {
    if (isEmailLoginPending) return;
    if (isEmailVerifyPending || isGoogleLoginPending) return;
    if (state.type !== 'login') return;

    mutateEmailLogin({
      input: {
        type: 'email.login',
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
    if (isEmailLoginPending || isGoogleLoginPending) return;
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

  const handleGoogleLogin = async (code: string) => {
    if (isGoogleLoginPending) return;
    if (isEmailLoginPending || isEmailVerifyPending) return;
    if (state.type !== 'login') return;

    mutateGoogleLogin({
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
    <div className="space-y-4">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {state.type === 'login' ? 'Welcome back' : 'Verify your email'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.type === 'login'
            ? 'Login to your account'
            : 'Enter the code sent to your email'}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <ServerDropdown
          value={auth.server?.domain ?? null}
          onChange={(domain) => {
            auth.setServer(domain);
          }}
          servers={auth.servers}
          readonly={state.type !== 'login'}
        />
        {state.type === 'login' && (
          <>
            <LoginForm
              onSubmit={handleLoginSubmit}
              isPending={isEmailLoginPending}
            />
            <GoogleLogin
              context="login"
              onLogin={handleGoogleLogin}
              isPending={isGoogleLoginPending}
            />
            <Button
              variant="link"
              className="w-full text-muted-foreground"
              onClick={() => {
                navigate({ to: '/auth/register' });
              }}
              type="button"
            >
              No account yet? Register
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
                setState({ type: 'login' });
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
