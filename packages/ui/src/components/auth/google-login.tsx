import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

import { Button } from '@colanode/ui/components/ui/button';
import { GoogleIcon } from '@colanode/ui/components/ui/icons';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useApp } from '@colanode/ui/contexts/app';
import { useAuth } from '@colanode/ui/contexts/auth';

interface GoogleLoginProps {
  context: 'login' | 'register';
  onLogin: (code: string) => void;
  isPending: boolean;
}

const GoogleLoginButton = ({
  context,
  onLogin,
  isPending,
}: GoogleLoginProps) => {
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      onLogin(response.code);
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

export const GoogleLogin = ({
  context,
  onLogin,
  isPending,
}: GoogleLoginProps) => {
  const app = useApp();
  const auth = useAuth();
  const config = auth.server.attributes.account?.google;

  if (app.type === 'web' && config && config.enabled && config.clientId) {
    return (
      <GoogleOAuthProvider clientId={config.clientId}>
        <GoogleLoginButton
          context={context}
          onLogin={onLogin}
          isPending={isPending}
        />
      </GoogleOAuthProvider>
    );
  }

  return null;
};
