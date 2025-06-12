import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

import { LoginOutput } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { GoogleIcon } from '@colanode/ui/components/ui/icons';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useApp } from '@colanode/ui/contexts/app';
import { useServer } from '@colanode/ui/contexts/server';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface GoogleLoginProps {
  context: 'login' | 'register';
  onSuccess: (output: LoginOutput) => void;
}

const GoogleLoginButton = ({ context, onSuccess }: GoogleLoginProps) => {
  const server = useServer();
  const { mutate, isPending } = useMutation();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      console.log('response', response);
      mutate({
        input: {
          type: 'google.login',
          code: response.code,
          server: server.domain,
        },
        onSuccess(output) {
          onSuccess(output);
        },
        onError(error) {
          toast.error(error.message);
        },
      });
    },
    flow: 'auth-code',
  });

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => login()}
      disabled={isPending}
      type="button"
    >
      {isPending ? (
        <Spinner className="mr-1 size-4" />
      ) : (
        <GoogleIcon className="mr-1 size-4" />
      )}
      {context === 'login' ? 'Login' : 'Register'} with Google
    </Button>
  );
};

export const GoogleLogin = ({ context, onSuccess }: GoogleLoginProps) => {
  const app = useApp();
  const server = useServer();
  const config = server.attributes.account?.google;

  if (app.type === 'web' && config && config.enabled && config.clientId) {
    return (
      <GoogleOAuthProvider clientId={config.clientId}>
        <GoogleLoginButton onSuccess={onSuccess} context={context} />
      </GoogleOAuthProvider>
    );
  }

  return null;
};
